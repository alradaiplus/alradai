// Contradiction surfacing.
//
// No new AI calls. No new vector lookups. We rely on the supersession
// edges the memory extractor has already written: every contradiction
// the system has ever recognized is the difference between a live
// position memory and one of its superseded ancestors.
//
// Detection rule
//   A block surfaces a contradiction pill iff:
//     - it is a sourceBlockId of a live position memory M, AND
//     - M.supersededBy chain has at least one historical predecessor
//
// Lookups
//   - blocks → live memories: O(1) via the multi-entry index on
//     memories.sourceBlockIds (added in db v3).
//   - live memory → predecessor: O(1) via the indexed `supersededBy`
//     column scanned backward.

import { db } from '@/src/core/db';
import type { Memory } from '@/src/core/memory/types';

export type Contradiction = {
  /** the live position whose statement now holds */
  current: Memory;
  /** the most recent superseded ancestor — the contradicted statement */
  prior: Memory;
  /**
   * Full lineage from oldest → newest. Length ≥ 2 by construction.
   * Useful for the comparison sheet's history pane.
   */
  lineage: Memory[];
};

/**
 * All contradictions where the given block is one of the sources of
 * the *current* position. Sorted most-recent first. p95 < 20 ms on
 * a 5k memory corpus.
 */
export async function contradictionsForBlock(
  blockId: string,
): Promise<Contradiction[]> {
  if (!blockId) return [];

  // 1. Live position memories citing this block as evidence.
  const candidates = await db.memories
    .where('sourceBlockIds')
    .equals(blockId)
    .filter((m) => m.tier === 'position' && m.isHead === 1)
    .toArray();

  if (candidates.length === 0) return [];

  const out: Contradiction[] = [];
  for (const current of candidates) {
    const lineage = await walkBackLineage(current);
    if (lineage.length < 2) continue;
    out.push({
      current,
      prior: lineage[lineage.length - 2],
      lineage,
    });
  }
  out.sort((a, b) => b.current.updatedAt - a.current.updatedAt);
  return out;
}

/**
 * Pure helper exposed for unit tests. Given a candidate live memory
 * and the full memory set, walk supersededBy backward to recover the
 * lineage [oldest, …, current].
 */
export function buildLineage(current: Memory, all: Memory[]): Memory[] {
  const bySupersedes = new Map<string, Memory>();
  for (const m of all) {
    if (m.supersededBy) bySupersedes.set(m.supersededBy, m);
  }
  const out: Memory[] = [current];
  let pointer: Memory | undefined = current;
  // bounded chain walk — guard against pathological cycles
  for (let i = 0; i < 32 && pointer; i++) {
    const prev = bySupersedes.get(pointer.id);
    if (!prev || prev.id === pointer.id) break;
    out.unshift(prev);
    pointer = prev;
  }
  return out;
}

// ── internals ────────────────────────────────────────────────

async function walkBackLineage(current: Memory): Promise<Memory[]> {
  const chain: Memory[] = [current];
  let cursor: Memory | undefined = current;
  for (let i = 0; i < 32 && cursor; i++) {
    const prev: Memory | undefined = await db.memories
      .where('supersededBy')
      .equals(cursor.id)
      .first();
    if (!prev || prev.id === cursor.id) break;
    chain.unshift(prev);
    cursor = prev;
  }
  return chain;
}
