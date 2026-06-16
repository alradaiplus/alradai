// On-device lexical embedding. 32-d, deterministic, no key required.
//
// Quality is sufficient for v1 Recall over a single user's corpus
// (hundreds to low-thousands of blocks). When wrapped in Tauri/RN,
// swap implementation for MLX `bge-small-en-1.5` (1024-d) without
// changing the consumer code — the function signature is stable.

import { fnv1a, tokenize } from '@/src/core/text';
import { db, saveEmbedding } from '@/src/core/db';
import type { Block, Embedding } from '@/src/core/types';

export const EMBED_DIM = 32;

export function embed(text: string): Embedding {
  const v = new Float32Array(EMBED_DIM);
  const tokens = tokenize(text);
  if (tokens.length === 0) return v;
  for (const t of tokens) {
    const h1 = fnv1a(t) % EMBED_DIM;
    const h2 = fnv1a('x' + t) % EMBED_DIM;
    v[h1] += 1;
    v[h2] += 0.5;
  }
  // L2 normalize so cosine == dot product
  let n = 0;
  for (let i = 0; i < EMBED_DIM; i++) n += v[i] * v[i];
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < EMBED_DIM; i++) v[i] /= n;
  return v;
}

export function cosine(a: Embedding, b: Embedding): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

export async function reembedIfMissing(block: Block): Promise<Embedding> {
  const existing = await db.embeddings.get(block.id);
  if (existing && existing.dim === EMBED_DIM) {
    return new Float32Array(existing.vector);
  }
  const v = embed(block.body);
  await saveEmbedding(block.id, v);
  return v;
}

export async function backfillEmbeddings(): Promise<number> {
  const blocks = await db.blocks.toArray();
  let n = 0;
  for (const b of blocks) {
    const e = await db.embeddings.get(b.id);
    if (e && e.dim === EMBED_DIM) continue;
    await saveEmbedding(b.id, embed(b.body));
    n++;
  }
  return n;
}
