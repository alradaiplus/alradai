// Pure ranking helpers. No Dexie, no React, no AI.

import type { Memory, MemoryTier, RankedItem } from './types';

// Tier weights — how much each tier nudges the score.
// Identity is rare but highly informative. Position is volatile but
// directly tied to the user's current thinking.
const TIER_WEIGHT: Record<MemoryTier, number> = {
  identity: 1.15,
  project: 1.1,
  position: 1.0,
};

// Recency boost: linear ramp from 1.0 (today) to 0.6 (90d old).
function recencyFactor(updatedAt: number, now: number): number {
  const ageDays = Math.max(0, (now - updatedAt) / 86_400_000);
  return Math.max(0.6, 1 - (ageDays / 90) * 0.4);
}

// Evidence boost: log-shaped so the second piece of evidence helps a
// lot, the tenth barely at all. Avoids runaway scores on stale topics.
function evidenceFactor(n: number): number {
  return 1 + Math.log10(Math.max(1, n)) * 0.25;
}

/**
 * Combined memory score given a similarity (cosine) and the memory itself.
 * Returns a 0..~2.5 score, higher is better.
 */
export function scoreMemory(
  similarity: number,
  m: Memory,
  now = Date.now(),
): number {
  if (m.isHead !== 1) return 0;
  return (
    similarity *
    m.confidence *
    TIER_WEIGHT[m.tier] *
    recencyFactor(m.updatedAt, now) *
    evidenceFactor(m.evidenceCount)
  );
}

/**
 * Reciprocal Rank Fusion. Merges two ranked lists (blocks and memories)
 * into a single ordering without needing them to share a score scale.
 * k=60 is the standard constant from Cormack & Clarke 2009.
 */
export function fuseRanks<T>(
  lanes: Array<RankedItem<T>[]>,
  k = 60,
): RankedItem<T>[] {
  const merged = new Map<string, { item: RankedItem<T>; score: number }>();
  for (const lane of lanes) {
    lane.forEach((entry, idx) => {
      const key = keyOf(entry.item);
      const contrib = 1 / (k + idx + 1);
      const prev = merged.get(key);
      if (prev) prev.score += contrib;
      else merged.set(key, { item: entry, score: contrib });
    });
  }
  return Array.from(merged.values())
    .sort((a, b) => b.score - a.score)
    .map((m) => ({ ...m.item, score: m.score }));
}

function keyOf(x: unknown): string {
  if (x && typeof x === 'object' && 'id' in (x as Record<string, unknown>)) {
    return String((x as { id: unknown }).id);
  }
  return JSON.stringify(x);
}

/**
 * Build a deterministic priority list for synthesis context injection.
 * Returns memories in the order they should be considered for the
 * 400-token budget: identity first, then most-recently-updated projects,
 * then positions ranked by similarity to the seed.
 */
export function prioritizeForSynthesis(
  identity: Memory[],
  projects: Memory[],
  positionsWithScore: Array<{ m: Memory; score: number }>,
  budgetItems = 12,
): Memory[] {
  const out: Memory[] = [];
  out.push(...identity);
  out.push(
    ...projects
      .filter((m) => m.isHead === 1)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 4),
  );
  out.push(
    ...positionsWithScore
      .filter((x) => x.m.isHead === 1)
      .sort((a, b) => b.score - a.score)
      .slice(0, budgetItems - out.length)
      .map((x) => x.m),
  );
  return out.slice(0, budgetItems);
}

/** Conservative token estimate — characters / 4. Good enough for budgeting. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
