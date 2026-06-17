// Thread Discovery.
//
// Weekly orchestration. Idempotent. Worker-side clustering.
//
//   1. Pull last 30 days of user blocks (source !== 'agent')
//   2. Reuse existing embeddings; backfill any missing
//   3. Cluster in a Web Worker — greedy centroid, cosine ≥ 0.55
//   4. For each cluster size ≥ 5:
//        - compute clusterSignature(memberIds)
//        - skip if a thread Block already tagged (week, csig) exists
//        - one LLM call (json mode) → { title, abstract }
//        - persist as agent Block with tags [thread, week-…, csig-…]
//        - links carry the member ids → backlinks light up immediately
//        - assertMemory({tier:'project'}) so the thread enters context

import { call } from '@/src/ai/queue';
import { embed } from '@/src/ai/embeddings';
import { cluster, type WorkerInput } from '@/src/ai/features/_workers/cluster.worker';
import { db, createBlock, lastRun, logRun } from '@/src/core/db';
import { DAY } from '@/src/core/time';
import {
  clusterSignature,
  csigTag,
  formatThreadBody,
  THREAD_TAG,
  weekKeyForSunday,
  weekTag,
} from '@/src/core/threads';
import type { Block } from '@/src/core/types';
import { assertMemory } from '@/src/core/memory/memory';
import { useSettings } from '@/src/store/settingsStore';

const SYSTEM = `You are the thread-discovery agent for Notes Canvas.
You receive a tight cluster of the user's recent blocks that share a
latent theme. Name the theme.

Output STRICT JSON:
{ "title": "<≤4 words>",
  "abstract": "<≤60 words, present tense, factual, no fluff>" }

Rules
- name the theme, not the blocks
- if the cluster is incoherent return { "title": "", "abstract": "" }
- no hedging, no advice, no marketing tone`;

const DEFAULT_THRESHOLD = 0.55;
const MIN_CLUSTER_SIZE = 5;
const LOOKBACK_DAYS = 30;
const COST_BUDGET_USD_PER_RUN = 0.5;

export type DiscoveryReport = {
  ranAt: number;
  weekKey: string;
  candidateClusters: number;
  newThreads: number;
  skippedDuplicates: number;
};

export type ThreadOutcome =
  | { ran: true; report: DiscoveryReport }
  | {
      ran: false;
      reason:
        | 'already-this-week'
        | 'no-key'
        | 'too-few-blocks'
        | 'no-clusters'
        | 'error';
      err?: string;
    };

/**
 * Run at most once per (local) calendar week. Sunday is the canonical
 * trigger day, but any first-open within the week is acceptable.
 */
export async function runThreadDiscoveryIfDue(): Promise<ThreadOutcome> {
  const weekKey = weekKeyForSunday();
  const lastThreadRun = await lastRun('thread');
  if (lastThreadRun && weekKeyForSunday(lastThreadRun.ranAt) === weekKey) {
    return { ran: false, reason: 'already-this-week' };
  }

  const settings = useSettings.getState().settings;
  if (!settings.apiKey) return { ran: false, reason: 'no-key' };

  const since = Date.now() - LOOKBACK_DAYS * DAY;
  const blocks = await db.blocks
    .where('createdAt')
    .above(since)
    .filter((b) => !b.archivedAt && b.source !== 'agent')
    .toArray();
  if (blocks.length < MIN_CLUSTER_SIZE) {
    return { ran: false, reason: 'too-few-blocks' };
  }

  try {
    return await runDiscoveryInner(blocks, weekKey, settings);
  } catch (e) {
    return { ran: false, reason: 'error', err: (e as Error).message };
  }
}

async function runDiscoveryInner(
  blocks: Block[],
  weekKey: string,
  settings: ReturnType<typeof useSettings.getState>['settings'],
): Promise<ThreadOutcome> {

  // 1. Embeddings — reuse, lazy-backfill.
  const embeds = await db.embeddings.toArray();
  const byId = new Map<string, Float32Array>();
  for (const e of embeds) byId.set(e.blockId, new Float32Array(e.vector));
  const ready: Array<{ id: string; v: number[] }> = [];
  for (const b of blocks) {
    let v = byId.get(b.id);
    if (!v) v = embed(b.body);
    ready.push({ id: b.id, v: Array.from(v) });
  }

  // 2. Cluster.
  const { clusters } = await runClusterInWorker({
    blocks: ready,
    threshold: DEFAULT_THRESHOLD,
    minSize: MIN_CLUSTER_SIZE,
  });
  if (clusters.length === 0) {
    await logEmptyRun(weekKey);
    return { ran: false, reason: 'no-clusters' };
  }

  // 3. Dedupe & generate.
  const wTag = weekTag();
  const blocksByTag = await db.blocks.where('tags').equals(wTag).toArray();
  const knownCsigs = new Set<string>();
  for (const b of blocksByTag) {
    if (!b.tags.includes(THREAD_TAG)) continue;
    for (const t of b.tags) if (t.startsWith('csig-')) knownCsigs.add(t);
  }

  let newThreads = 0;
  let skippedDuplicates = 0;
  let spentUsd = 0;

  for (const c of clusters) {
    const csig = csigTag(c.memberIds);
    if (knownCsigs.has(csig)) {
      skippedDuplicates++;
      continue;
    }
    if (spentUsd >= COST_BUDGET_USD_PER_RUN) break;

    const titleAndAbstract = await generateForCluster(c.memberIds);
    if (!titleAndAbstract) continue;

    const { title, abstract, costUsd } = titleAndAbstract;
    spentUsd += costUsd;
    if (!title.trim() || !abstract.trim()) continue;

    const threadBlock = await createBlock({
      body: formatThreadBody(title, abstract),
      source: 'agent',
      tags: [THREAD_TAG, wTag, csig],
      links: c.memberIds,
    });

    // Threads become memory inputs.
    await assertMemory({
      tier: 'project',
      subjectLabel: title,
      statement: abstract.slice(0, 220),
      confidence: 0.7,
      sourceBlockIds: c.memberIds,
    });

    knownCsigs.add(csig);
    newThreads++;
    void threadBlock;
  }

  await logRun({
    kind: 'thread',
    ranAt: Date.now(),
    provider: settings.provider,
    model: settings.models.threads,
    costUsd: spentUsd,
    ok: 1,
  });

  return {
    ran: true,
    report: {
      ranAt: Date.now(),
      weekKey,
      candidateClusters: clusters.length,
      newThreads,
      skippedDuplicates,
    },
  };
}

/**
 * List the current week's threads. Used by the Today card. Cheap —
 * single indexed tag lookup, then a tag filter pass.
 */
export async function listCurrentWeekThreads(): Promise<Block[]> {
  const wTag = weekTag();
  const rows = await db.blocks.where('tags').equals(wTag).toArray();
  return rows
    .filter((b) => b.tags.includes(THREAD_TAG) && !b.archivedAt)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ── internals ───────────────────────────────────────────────

async function runClusterInWorker(input: WorkerInput) {
  // Web Worker on browser/desktop; main-thread fallback for tests / SSR.
  if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
    try {
      return await new Promise<{ clusters: Array<{ memberIds: string[]; centroid: number[] }> }>((resolve, reject) => {
        const worker = new Worker(
          new URL('./_workers/cluster.worker.ts', import.meta.url),
          { type: 'module' },
        );
        worker.onmessage = (e) => {
          resolve(e.data);
          worker.terminate();
        };
        worker.onerror = (e) => {
          worker.terminate();
          reject(new Error(e.message));
        };
        worker.postMessage(input);
      });
    } catch {
      // fall through to main-thread path
    }
  }
  return cluster(input);
}

async function generateForCluster(
  memberIds: string[],
): Promise<{ title: string; abstract: string; costUsd: number } | null> {
  const blocks = await Promise.all(memberIds.map((id) => db.blocks.get(id)));
  const corpus = blocks
    .filter((b): b is Block => !!b)
    .map((b) => `[[${b.id}]] ${b.body.replace(/\s+/g, ' ').slice(0, 600)}`)
    .join('\n\n');

  const settings = useSettings.getState().settings;
  try {
    const res = await call('thread', {
      model: settings.models.threads,
      system: SYSTEM,
      temperature: Math.min(settings.temperature, 0.4),
      reasoning: settings.reasoning,
      maxTokens: 280,
      json: true,
      messages: [
        {
          role: 'user',
          content: `Cluster (${memberIds.length} blocks):\n\n${corpus}`,
        },
      ],
    });
    const parsed = JSON.parse(res.text) as { title?: string; abstract?: string };
    return {
      title: (parsed.title ?? '').toString().trim(),
      abstract: (parsed.abstract ?? '').toString().trim(),
      costUsd: res.costUsd ?? 0,
    };
  } catch {
    return null;
  }
}

async function logEmptyRun(_weekKey: string) {
  const settings = useSettings.getState().settings;
  await logRun({
    kind: 'thread',
    ranAt: Date.now(),
    provider: settings.provider,
    model: settings.models.threads,
    ok: 1,
    costUsd: 0,
  });
}

// Exported for tests
export const __test__ = {
  clusterSignature,
  weekKeyForSunday,
  DEFAULT_THRESHOLD,
  MIN_CLUSTER_SIZE,
};
