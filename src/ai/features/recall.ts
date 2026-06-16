// Recall — surfaces past blocks (and now memories) related to a seed.
// On-device only for the block lane; memory lane is also on-device.
// No LLM call, no network, no key required.

import { db, readAllEmbeddings } from '@/src/core/db';
import type { Block } from '@/src/core/types';
import { cosine, embed, reembedIfMissing } from '@/src/ai/embeddings';
import { fuseRanks } from '@/src/core/memory/ranking';
import type { Memory, RankedItem } from '@/src/core/memory/types';
import { retrieveMemories } from '@/src/ai/features/memory';

/**
 * Backward-compatible Recall: returns just blocks. Internally fuses
 * memory hits and blocks via RRF so memories whose subject the user is
 * actively typing about pull the right block neighbors up the list.
 */
export async function recall(seed: string, k = 3): Promise<Block[]> {
  const fused = await recallFused(seed, k * 4);
  return fused
    .filter((r): r is RankedItem<Block> => r.lane === 'block')
    .slice(0, k)
    .map((r) => r.item);
}

/**
 * Fused recall: returns a ranked list across both lanes (blocks +
 * memories). Used by the synthesis path and any future surface that
 * wants to render typed results inline.
 */
export async function recallFused(
  seed: string,
  k = 12,
): Promise<RankedItem<Block | Memory>[]> {
  if (seed.trim().length < 6) return [];
  const blockLane = await rankBlocks(seed, k);
  const memoryLane = await retrieveMemories(seed, k);
  return fuseRanks<Block | Memory>([blockLane, memoryLane], 60).slice(0, k);
}

// ── internals ────────────────────────────────────────────────

async function rankBlocks(seed: string, k: number): Promise<RankedItem<Block>[]> {
  const q = embed(seed);
  const stored = await readAllEmbeddings();
  const blocks = await db.blocks.toArray();
  const haveIds = new Set(stored.map((s) => s.id));

  const all: Array<{ id: string; v: Float32Array }> = stored.slice();
  for (const b of blocks) {
    if (!b.archivedAt && !haveIds.has(b.id)) {
      const v = await reembedIfMissing(b);
      all.push({ id: b.id, v });
    }
  }

  const idToBlock = new Map(blocks.map((b) => [b.id, b]));
  return all
    .map((e) => {
      const b = idToBlock.get(e.id);
      if (!b || b.archivedAt) return null;
      return { b, s: cosine(q, e.v) };
    })
    .filter((x): x is { b: Block; s: number } => !!x && x.s > 0.1)
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => ({ item: x.b, score: x.s, lane: 'block' as const }));
}
