// Memory feature.
//
//   extractFromBlocks  — batch LLM pass turning a day's blocks into MemoryDeltas
//                        (called from the nightly synthesis job — never on save)
//   embedMemory        — write a memory embedding; mirrors block embeddings
//   retrieveMemories   — semantic retrieval against the memory store
//   buildContext       — produce the <known_context> string for synthesis,
//                        capped at the configured token budget

import { call } from '@/src/ai/queue';
import { embed, cosine, EMBED_DIM } from '@/src/ai/embeddings';
import { db } from '@/src/core/db';
import type { Block } from '@/src/core/types';
import {
  assertMemory,
  listMemories,
  supersedeMemory,
  slugSubject,
} from '@/src/core/memory/memory';
import {
  estimateTokens,
  prioritizeForSynthesis,
  scoreMemory,
} from '@/src/core/memory/ranking';
import type { Memory, MemoryDelta, MemoryTier, RankedItem } from '@/src/core/memory/types';
import { useSettings } from '@/src/store/settingsStore';

const SYSTEM = `You are the memory extractor for Notes Canvas.
You read a batch of the user's recent blocks and emit durable, typed
interpretations of who they are, what they're working on, and what
they currently believe.

Output STRICT JSON in the shape:
{ "deltas": [
    { "op": "assert" | "supersede",
      "replaces": "<id, only when op=supersede>",
      "tier": "identity" | "project" | "position",
      "subjectLabel": "<short topic, e.g. 'back-EMF detection'>",
      "statement": "<one sentence>",
      "confidence": <0..1>,
      "sourceBlockIds": ["<blockId>", ...] }
] }

Rules
- emit at most 8 deltas
- one delta per (tier, subject)
- statement is ONE sentence, present tense, factual
- confidence reflects how strongly the blocks support the claim
- if you see a block contradicting a Known memory below, emit op="supersede"
  with replaces=<that memory id>
- do not invent facts not present in the blocks
- skip rather than guess`;

type ExtractorResult = { deltas: Array<RawDelta> };
type RawDelta = {
  op: 'assert' | 'supersede';
  replaces?: string;
  tier: MemoryTier;
  subjectLabel: string;
  statement: string;
  confidence: number;
  sourceBlockIds: string[];
};

/**
 * Run the extractor over a set of source blocks. Persists resulting
 * memories (with provenance) and writes their embeddings.
 *
 * Caller is responsible for batching — typically the nightly Synthesis
 * job invokes this once per day with the previous 24h of blocks.
 */
export async function extractFromBlocks(blocks: Block[]): Promise<{
  applied: number;
  asserted: number;
  superseded: number;
}> {
  if (blocks.length === 0) return { applied: 0, asserted: 0, superseded: 0 };

  const settings = useSettings.getState().settings;
  if (!settings.apiKey) return { applied: 0, asserted: 0, superseded: 0 };

  const known = await listMemories({ limit: 80 });
  const knownPayload = known
    .map(
      (m) =>
        `${m.id} [${m.tier}/${m.subject}] ${m.statement.replace(/\s+/g, ' ').slice(0, 200)}`,
    )
    .join('\n');

  const blocksPayload = blocks
    .map(
      (b) =>
        `[[${b.id}]] ${b.body.replace(/\s+/g, ' ').slice(0, 700)}`,
    )
    .join('\n\n');

  const res = await call('thread', {
    // 'thread' reuses an existing AgentRun kind to keep migrations
    // additive. Cost shows up against the same monthly budget.
    model: settings.models.threads || settings.models.synthesis,
    system: SYSTEM,
    temperature: settings.temperature,
    reasoning: settings.reasoning,
    maxTokens: 1200,
    json: true,
    messages: [
      {
        role: 'user',
        content: `Known memories:\n${knownPayload || '(none)'}\n\nBlocks:\n\n${blocksPayload}`,
      },
    ],
  });

  let parsed: ExtractorResult;
  try {
    parsed = JSON.parse(res.text) as ExtractorResult;
  } catch {
    return { applied: 0, asserted: 0, superseded: 0 };
  }

  const valid = (parsed.deltas ?? [])
    .map(coerceDelta)
    .filter((d): d is MemoryDelta => d !== null);

  let asserted = 0;
  let superseded = 0;
  for (const d of valid) {
    if (d.op === 'supersede') {
      const out = await supersedeMemory(d.replaces, {
        tier: d.tier,
        subjectLabel: d.subjectLabel,
        statement: d.statement,
        confidence: d.confidence,
        sourceBlockIds: d.sourceBlockIds,
      });
      if (out) {
        superseded++;
        void embedMemory(out);
      }
    } else {
      const out = await assertMemory({
        tier: d.tier,
        subjectLabel: d.subjectLabel,
        statement: d.statement,
        confidence: d.confidence,
        sourceBlockIds: d.sourceBlockIds,
      });
      asserted++;
      void embedMemory(out);
    }
  }

  return { applied: asserted + superseded, asserted, superseded };
}

export async function embedMemory(m: Memory): Promise<void> {
  const v = embed(`${m.subjectLabel} — ${m.statement}`);
  const buf = new ArrayBuffer(v.byteLength);
  new Float32Array(buf).set(v);
  await db.memoryEmbeddings.put({ memoryId: m.id, vector: buf, dim: v.length });
}

/**
 * Semantic retrieval over live memories. Returns RankedItems usable by
 * the fusion layer in recall.ts.
 */
export async function retrieveMemories(
  seed: string,
  k = 6,
): Promise<RankedItem<Memory>[]> {
  if (seed.trim().length < 6) return [];
  const q = embed(seed);
  const all = await db.memories.where('isHead').equals(1).toArray();
  if (all.length === 0) return [];

  const embeds = await db.memoryEmbeddings.toArray();
  const byId = new Map<string, Float32Array>();
  for (const e of embeds) {
    if (e.dim === EMBED_DIM) byId.set(e.memoryId, new Float32Array(e.vector));
  }

  // Lazy backfill: embed any memory that's missing one. Bounded so we
  // don't blow the budget if the table is large.
  const missing = all.filter((m) => !byId.has(m.id)).slice(0, 50);
  for (const m of missing) {
    await embedMemory(m);
    const fresh = await db.memoryEmbeddings.get(m.id);
    if (fresh) byId.set(m.id, new Float32Array(fresh.vector));
  }

  const now = Date.now();
  const scored = all
    .map((m) => {
      const v = byId.get(m.id);
      if (!v) return null;
      const sim = cosine(q, v);
      return { m, sim };
    })
    .filter((x): x is { m: Memory; sim: number } => !!x && x.sim > 0.05)
    .map(({ m, sim }) => ({
      item: m,
      score: scoreMemory(sim, m, now),
      lane: 'memory' as const,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return scored;
}

/**
 * Build the <known_context> block that gets injected into synthesis.
 * Deterministic priority: identity → recent projects → top positions by
 * relevance to the day's seed text. Hard token cap.
 */
export async function buildContext(
  seedText: string,
  budgetTokens = 400,
): Promise<string> {
  const [identity, projects, positionHits] = await Promise.all([
    listMemories({ tier: 'identity', limit: 4 }),
    listMemories({ tier: 'project', limit: 12 }),
    retrieveMemories(seedText, 20),
  ]);

  const positions = positionHits
    .filter((r) => r.item.tier === 'position')
    .map((r) => ({ m: r.item, score: r.score }));

  const candidates = prioritizeForSynthesis(identity, projects, positions, 16);

  // Greedy pack until we hit the budget.
  const lines: string[] = [];
  let used = estimateTokens('<known_context>\n</known_context>\n');
  for (const m of candidates) {
    const line = `- [${m.tier}] ${m.subjectLabel}: ${m.statement}`;
    const cost = estimateTokens(line) + 1;
    if (used + cost > budgetTokens) break;
    lines.push(line);
    used += cost;
  }

  if (lines.length === 0) return '';
  return ['<known_context>', ...lines, '</known_context>'].join('\n');
}

// ── coercion ─────────────────────────────────────────────────

function coerceDelta(d: RawDelta): MemoryDelta | null {
  if (!d || typeof d !== 'object') return null;
  const tier = d.tier;
  if (tier !== 'identity' && tier !== 'project' && tier !== 'position') return null;
  const statement = (d.statement ?? '').toString().trim();
  if (statement.length < 4) return null;
  const subjectLabel = (d.subjectLabel ?? '').toString().trim();
  if (subjectLabel.length < 2) return null;
  // sanity: rebuild slug locally — the extractor's free-text is only a label
  void slugSubject(subjectLabel);

  const confidence = clamp01(Number(d.confidence ?? 0.6));
  const sourceBlockIds = Array.isArray(d.sourceBlockIds)
    ? d.sourceBlockIds.map(String).filter(Boolean).slice(0, 24)
    : [];
  if (sourceBlockIds.length === 0) return null;

  if (d.op === 'supersede') {
    if (!d.replaces || typeof d.replaces !== 'string') return null;
    return {
      op: 'supersede',
      replaces: d.replaces,
      tier,
      subjectLabel,
      statement,
      confidence,
      sourceBlockIds,
    };
  }
  return {
    op: 'assert',
    tier,
    subjectLabel,
    statement,
    confidence,
    sourceBlockIds,
  };
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0.5;
  return Math.min(1, Math.max(0, x));
}
