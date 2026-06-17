// Board generation.
//
// The board answers "what does the agent think is happening here?" —
// not "how are these notes connected." Edges are typed claims; cluster
// placement encodes argumentative structure.
//
// Pipeline
//   1. embed(topic) → top-N blocks by cosine
//   2. cluster blocks (worker)
//   3. inject memory context + already-named themes from threads
//   4. one LLM call (json mode) → { title, clusters[], edges[] }
//        - LLM names each cluster and places it on the plane
//        - LLM emits ≤ N typed edges
//   5. locally fan-out per-node positions around each cluster center
//   6. persist as boards/board_nodes/board_edges rows
//

import { call } from '@/src/ai/queue';
import { embed, cosine } from '@/src/ai/embeddings';
import { cluster as clusterFn } from '@/src/ai/features/_workers/cluster.worker';
import { buildContext } from '@/src/ai/features/memory';
import { db } from '@/src/core/db';
import { createBoard } from '@/src/core/boards/boards';
import { THREAD_TAG, parseThreadBody } from '@/src/core/threads';
import { useSettings } from '@/src/store/settingsStore';
import type { Block } from '@/src/core/types';
import type { Board, BoardCluster, EdgeLabel } from '@/src/core/boards/types';
import { EDGE_LABELS } from '@/src/core/boards/types';

const SYSTEM = `You are the research-board agent for Notes Canvas.
You are NOT drawing a graph of how notes connect. You are stating what
you think is happening across the user's blocks on the topic.

You may receive three additional sections:
  <known_context>  what you already know about this user from memory
  <named_themes>   themes the user has already crystallized into
                   recurring threads — never re-name these clusters
  Cluster N        the raw blocks pre-grouped for you to interpret

Output STRICT JSON:

{
  "title": "<≤6 words>",
  "clusters": [
    { "id":"c0", "label":"<≤3 words>", "x":<-300..300>, "y":<-200..200> }
  ],
  "edges": [
    { "from":"<blockId>", "to":"<blockId>",
      "label":"supports" | "contradicts" | "derives" | "asks" }
  ]
}

Rules
- name every input cluster id you receive
- place clusters with structure: foundations top-left, current approach
  middle, conclusions bottom, open questions top-right
- emit at most 16 edges total — only when you have a real claim
- use only the four label values listed
- do not invent block ids
- if you cannot read a clear interpretation, return empty clusters and
  edges arrays (the board will be discarded)`;

const TOP_K_BLOCKS = 40;
const MAX_NODES = 200;
const CLUSTER_THRESHOLD = 0.5;
const MIN_CLUSTER_SIZE = 2; // boards may surface lone-block clusters

export type GeneratedBoard = { board: Board; nodes: number; edges: number };

/**
 * Generate a board for a topic. Returns null when there's too little
 * material to form a meaningful interpretation.
 */
export async function generateBoard(topic: string): Promise<GeneratedBoard | null> {
  const t = topic.trim();
  if (t.length < 2) return null;

  const settings = useSettings.getState().settings;
  if (!settings.apiKey) throw new Error('No API key — add one in Settings (⌘,).');

  // 1. retrieve
  const candidates = await retrieveTopBlocks(t, TOP_K_BLOCKS);
  if (candidates.length < 4) return null;

  // 2. cluster
  const { clusters } = clusterFn({
    blocks: candidates.map((c) => ({ id: c.id, v: Array.from(c.v) })),
    threshold: CLUSTER_THRESHOLD,
    minSize: MIN_CLUSTER_SIZE,
  });
  if (clusters.length === 0) return null;

  // Assign each block to its cluster id. Singletons fall into a
  // catch-all cluster named "other".
  const clusterByBlock = new Map<string, string>();
  const clusterIds = clusters.map((_, i) => `c${i}`);
  clusters.forEach((c, i) => {
    for (const id of c.memberIds) clusterByBlock.set(id, clusterIds[i]);
  });
  const orphans = candidates.filter((c) => !clusterByBlock.has(c.id));
  if (orphans.length > 0) {
    const otherId = `c${clusters.length}`;
    clusterIds.push(otherId);
    for (const o of orphans) clusterByBlock.set(o.id, otherId);
  }

  // Prepare the LLM payload: per cluster, a few representative excerpts.
  const blocksById = new Map(
    (await Promise.all(candidates.map((c) => db.blocks.get(c.id)))).flatMap(
      (b) => (b ? [[b.id, b] as const] : []),
    ),
  );
  const clusterPayload = clusterIds.map((cid) => {
    const memberIds: string[] = [];
    for (const [bid, c] of clusterByBlock) if (c === cid) memberIds.push(bid);
    const sample = memberIds
      .slice(0, 6)
      .map((bid) => {
        const b = blocksById.get(bid);
        if (!b) return '';
        return `  [[${bid}]] ${b.body.replace(/\s+/g, ' ').slice(0, 280)}`;
      })
      .filter(Boolean)
      .join('\n');
    return `Cluster ${cid} (${memberIds.length} blocks):\n${sample}`;
  });

  // 3. Inject memory + already-named themes.
  const memoryCtx = await buildContext(t, 300);
  const candidateBlocksFlat = Array.from(blocksById.values());
  const threadTitles = collectNamedThemes(candidateBlocksFlat);
  const namedThemesBlock = threadTitles.length
    ? `<named_themes>\n${threadTitles.map((x) => `- ${x}`).join('\n')}\n</named_themes>`
    : '';

  // 4. LLM call (structured output)
  const userPrompt = [
    `Topic: ${t}`,
    memoryCtx,
    namedThemesBlock,
    ...clusterPayload,
  ]
    .filter((s) => s && s.length > 0)
    .join('\n\n');
  const res = await call('board', {
    model: settings.models.boards,
    system: SYSTEM,
    temperature: Math.min(settings.temperature, 0.4),
    reasoning: settings.reasoning,
    maxTokens: 900,
    json: true,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const parsed = safeParseBoardJson(res.text);
  if (!parsed) return null;

  // Use only clusters the LLM actually labeled.
  const namedClusters: BoardCluster[] = parsed.clusters
    .filter((c) => clusterIds.includes(c.id))
    .map((c) => ({
      id: c.id,
      label: c.label || 'unnamed',
      x: clamp(c.x, -340, 340),
      y: clamp(c.y, -220, 220),
    }));
  if (namedClusters.length === 0) return null;

  const namedIds = new Set(namedClusters.map((c) => c.id));

  // 4. local fan-out of node positions
  const allBlockIds = candidates.map((c) => c.id).slice(0, MAX_NODES);
  const memberCount = new Map<string, number>();
  const nodes: Array<{ blockId: string; x: number; y: number; cluster: string }> = [];
  for (const bid of allBlockIds) {
    const cid = clusterByBlock.get(bid) ?? namedClusters[0].id;
    if (!namedIds.has(cid)) continue;
    const center = namedClusters.find((c) => c.id === cid)!;
    const idx = memberCount.get(cid) ?? 0;
    memberCount.set(cid, idx + 1);
    const { x, y } = fanOut(center.x, center.y, idx);
    nodes.push({ blockId: bid, x, y, cluster: cid });
  }

  // Filter edges to valid label + block ids actually in the board
  const nodeBlockIds = new Set(nodes.map((n) => n.blockId));
  const edges = parsed.edges
    .filter(
      (e) =>
        EDGE_LABELS.includes(e.label as EdgeLabel) &&
        nodeBlockIds.has(e.from) &&
        nodeBlockIds.has(e.to) &&
        e.from !== e.to,
    )
    .slice(0, 16)
    .map((e) => ({
      fromBlockId: e.from,
      toBlockId: e.to,
      label: e.label as EdgeLabel,
    }));

  // 5. persist
  const board = await createBoard({
    title: parsed.title.trim() || t,
    topic: t,
    origin: 'agent',
    prompt: userPrompt,
    clusters: namedClusters,
    nodes,
    edges,
  });

  return { board, nodes: nodes.length, edges: edges.length };
}

// ── retrieval ──────────────────────────────────────────────

async function retrieveTopBlocks(
  topic: string,
  k: number,
): Promise<Array<{ id: string; v: Float32Array }>> {
  const q = embed(topic);
  const embeds = await db.embeddings.toArray();
  const blocks = await db.blocks.toArray();
  const byId = new Map<string, Float32Array>();
  for (const e of embeds) byId.set(e.blockId, new Float32Array(e.vector));

  const scored: Array<{ id: string; v: Float32Array; s: number }> = [];
  for (const b of blocks) {
    if (b.archivedAt) continue;
    const v = byId.get(b.id) ?? embed(b.body);
    scored.push({ id: b.id, v, s: cosine(q, v) });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored
    .filter((x) => x.s > 0.05)
    .slice(0, k)
    .map(({ id, v }) => ({ id, v }));
}

// ── parsing / utils ────────────────────────────────────────

type RawBoardJson = {
  title: string;
  clusters: Array<{ id: string; label: string; x: number; y: number }>;
  edges: Array<{ from: string; to: string; label: string }>;
};

function safeParseBoardJson(text: string): RawBoardJson | null {
  try {
    const o = JSON.parse(text) as Partial<RawBoardJson>;
    if (
      !o ||
      typeof o.title !== 'string' ||
      !Array.isArray(o.clusters) ||
      !Array.isArray(o.edges)
    ) {
      return null;
    }
    return {
      title: o.title,
      clusters: o.clusters
        .filter(
          (c) =>
            c &&
            typeof c.id === 'string' &&
            typeof c.label === 'string' &&
            Number.isFinite(c.x) &&
            Number.isFinite(c.y),
        )
        .slice(0, 12),
      edges: o.edges
        .filter(
          (e) =>
            e &&
            typeof e.from === 'string' &&
            typeof e.to === 'string' &&
            typeof e.label === 'string',
        )
        .slice(0, 24),
    };
  } catch {
    return null;
  }
}

function clamp(x: number, lo: number, hi: number): number {
  if (!Number.isFinite(x)) return (lo + hi) / 2;
  return Math.min(hi, Math.max(lo, x));
}

/**
 * Pull theme titles out of any thread Blocks present in the retrieval
 * set. The agent is told never to re-name these.
 */
function collectNamedThemes(blocks: Block[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const b of blocks) {
    if (!b.tags.includes(THREAD_TAG)) continue;
    const { title } = parseThreadBody(b.body);
    const norm = title.toLowerCase();
    if (!title || seen.has(norm)) continue;
    seen.add(norm);
    out.push(title);
    if (out.length >= 8) break;
  }
  return out;
}

/**
 * Deterministic radial fan-out around a cluster center.
 * 8 nodes per ring at radii 80, 140, 200, … so a 200-node cluster fans
 * 25 rings deep — never overlaps within reasonable cluster sizes.
 */
export function fanOut(cx: number, cy: number, idx: number): { x: number; y: number } {
  if (idx === 0) return { x: cx, y: cy };
  const PER_RING = 8;
  const ring = Math.ceil(idx / PER_RING);
  const slot = (idx - 1) % PER_RING;
  const radius = 80 + ring * 60;
  // 22.5° offset per ring keeps rings from aligning radially
  const angle = (slot / PER_RING) * Math.PI * 2 + ring * 0.39;
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}
