// Recall — on-device only. No LLM call, no key required, no network.

import { db, readAllEmbeddings } from '@/src/core/db';
import type { Block } from '@/src/core/types';
import { cosine, embed, reembedIfMissing } from '@/src/ai/embeddings';

export async function recall(seed: string, k = 3): Promise<Block[]> {
  const seedText = seed.trim();
  if (seedText.length < 8) return [];
  const q = embed(seedText);
  const all = await readAllEmbeddings();
  if (all.length === 0) return [];
  // backfill missing embeddings opportunistically
  const blocks = await db.blocks.toArray();
  const haveIds = new Set(all.map((a) => a.id));
  for (const b of blocks) {
    if (!haveIds.has(b.id) && !b.archivedAt) {
      const v = await reembedIfMissing(b);
      all.push({ id: b.id, v });
    }
  }
  // score
  const idToBlock = new Map(blocks.map((b) => [b.id, b]));
  const scored = all
    .map((e) => {
      const b = idToBlock.get(e.id);
      if (!b || b.archivedAt) return null;
      return { b, s: cosine(q, e.v) };
    })
    .filter((x): x is { b: Block; s: number } => !!x)
    .filter((x) => x.s > 0.1)
    .sort((a, b) => b.s - a.s)
    .slice(0, k);
  return scored.map((x) => x.b);
}
