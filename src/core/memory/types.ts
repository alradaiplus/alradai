// ─────────────────────────────────────────────────────────────
// Memory — a typed interpretation of the user, derived from blocks.
//
//   Identity   permanent       "User is a mechatronics PhD student"
//   Project    months          "Motor controller prototype due August"
//   Position   weeks           "Back-EMF unreliable below 200 rpm"
//
// Identity strategy
//   Surface identity = (tier, subject)   — at most one live head per surface
//   Statement        = the claim itself   — two statements on the same surface
//                                            are mutually exclusive → supersede
//
// Invariants
//   - Exactly one row per (tier, subject) has isHead === 1.
//   - sourceBlockIds is canonical evidence; evidenceCount === sourceBlockIds.length
//     is a denormalized cache for ranking.
//   - Append-only: rows are never destroyed. Soft-delete via archivedAt.
// ─────────────────────────────────────────────────────────────

export type MemoryTier = 'identity' | 'project' | 'position';

export type Memory = {
  id: string;
  tier: MemoryTier;

  /** Normalized slug for surface identity, e.g. "back-emf". */
  subject: string;
  /** Human-readable label, preserved verbatim from the extractor. */
  subjectLabel: string;

  /** The claim itself. One sentence. */
  statement: string;

  /** Extractor's confidence at insert time, 0..1. */
  confidence: number;
  /**
   * Denormalized cache of sourceBlockIds.length.
   * INVARIANT: must equal sourceBlockIds.length at write time.
   * Used by the ranking layer to avoid recomputing every retrieval.
   */
  evidenceCount: number;

  /** ULIDs of blocks whose content produced this memory. Canonical evidence. */
  sourceBlockIds: string[];

  createdAt: number;
  updatedAt: number;

  /** id of the memory that replaces this one. null when still live. */
  supersededBy: string | null;
  /** soft-delete tombstone. null when not deleted. */
  archivedAt: number | null;

  /**
   * Denormalized "is this the live head?" flag.
   *   1 → live, retrievable
   *   0 → superseded or archived
   * Indexed for O(1) retrieval.
   * INVARIANT: at most one isHead=1 row per (tier, subject).
   */
  isHead: 0 | 1;
};

/** What the extractor returns — pre-persistence shape. */
export type MemoryDelta =
  | {
      op: 'assert';
      tier: MemoryTier;
      subjectLabel: string;
      statement: string;
      confidence: number;
      sourceBlockIds: string[];
    }
  | {
      op: 'supersede';
      replaces: string; // existing memory id
      tier: MemoryTier;
      subjectLabel: string;
      statement: string;
      confidence: number;
      sourceBlockIds: string[];
    };

/** Common scoring shape used by retrieval fusion. */
export type RankedItem<T> = {
  item: T;
  score: number;
  /** Origin lane — used by reciprocal-rank fusion. */
  lane: 'block' | 'memory';
};
