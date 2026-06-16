// CRUD over the memories table. Pure DB calls. No AI, no React.
//
// Identity invariant
//   At most one row per (tier, subject) has isHead === 1.
//   assertMemory() is the only public path that may mutate a head.
//
// Provenance invariant
//   evidenceCount === sourceBlockIds.length on every write.

import { db } from '@/src/core/db';
import { ulid } from '@/src/core/ids';
import type { Memory, MemoryTier } from './types';

/** Normalize free-text subject to a stable slug. Collision-safe surface key. */
export function slugSubject(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

type CreateInput = {
  tier: MemoryTier;
  subjectLabel: string;
  statement: string;
  confidence: number;
  sourceBlockIds: string[];
};

/**
 * High-level write API used by the AI layer and the store.
 *
 * Semantics
 *   no head exists                       → insert new head
 *   head exists, same statement          → extend provenance (dedupe)
 *   head exists, different statement     → supersede old head with new
 *
 * Returns the resulting live head row.
 */
export async function assertMemory(input: CreateInput): Promise<Memory> {
  const subject = slugSubject(input.subjectLabel);
  const head = await findHead(input.tier, subject);

  if (head && head.statement.trim() === input.statement.trim()) {
    return extendProvenance(head, input);
  }
  if (head) {
    return doSupersede(head, input, subject);
  }
  return doInsert(input, subject);
}

/**
 * Explicit supersession, e.g. from the Settings editor when the user
 * rewrites a statement. Never updates the old row's statement — it
 * stays as a historical record with isHead=0.
 */
export async function supersedeMemory(
  replacesId: string,
  next: CreateInput,
): Promise<Memory | undefined> {
  const old = await db.memories.get(replacesId);
  if (!old) return undefined;
  return doSupersede(old, next, slugSubject(next.subjectLabel));
}

export async function getMemory(id: string): Promise<Memory | undefined> {
  return db.memories.get(id);
}

/** Soft-delete tombstone. Append-only: the row stays, isHead flips. */
export async function deleteMemory(id: string): Promise<void> {
  const now = Date.now();
  await db.memories.update(id, {
    archivedAt: now,
    isHead: 0,
    updatedAt: now,
  });
}

export async function listMemories(opts?: {
  tier?: MemoryTier;
  limit?: number;
}): Promise<Memory[]> {
  const limit = opts?.limit ?? 500;
  const all = opts?.tier
    ? await db.memories.where('[tier+isHead]').equals([opts.tier, 1]).toArray()
    : await db.memories.where('isHead').equals(1).toArray();
  all.sort((a, b) => b.updatedAt - a.updatedAt);
  return all.slice(0, limit);
}

export async function countMemories(): Promise<number> {
  return db.memories.where('isHead').equals(1).count();
}

/** Lexical search over subject + statement. Settings UI uses this. */
export async function searchMemory(query: string, limit = 50): Promise<Memory[]> {
  const q = query.trim().toLowerCase();
  if (!q) return listMemories({ limit });
  const all = await db.memories.where('isHead').equals(1).toArray();
  const hits = all.filter(
    (m) =>
      m.subject.includes(q) ||
      m.subjectLabel.toLowerCase().includes(q) ||
      m.statement.toLowerCase().includes(q),
  );
  hits.sort((a, b) => b.updatedAt - a.updatedAt);
  return hits.slice(0, limit);
}

/**
 * Maintenance: rebuild the evidenceCount cache from sourceBlockIds.
 * Idempotent. Cheap. Called from store hydrate as a self-heal.
 */
export async function repairEvidenceCounts(): Promise<number> {
  let fixed = 0;
  await db.memories.toCollection().each(async (m) => {
    const expected = m.sourceBlockIds.length;
    if (m.evidenceCount !== expected) {
      await db.memories.update(m.id, { evidenceCount: expected });
      fixed++;
    }
  });
  return fixed;
}

// ── internals ─────────────────────────────────────────────────

async function findHead(tier: MemoryTier, subject: string): Promise<Memory | undefined> {
  return db.memories.where('[tier+subject+isHead]').equals([tier, subject, 1]).first();
}

async function doInsert(input: CreateInput, subject: string): Promise<Memory> {
  const now = Date.now();
  const sourceBlockIds = uniq(input.sourceBlockIds);
  const m: Memory = {
    id: ulid(now),
    tier: input.tier,
    subject,
    subjectLabel: input.subjectLabel,
    statement: input.statement.trim(),
    confidence: clamp01(input.confidence),
    evidenceCount: sourceBlockIds.length,
    sourceBlockIds,
    createdAt: now,
    updatedAt: now,
    supersededBy: null,
    archivedAt: null,
    isHead: 1,
  };
  await db.memories.add(m);
  return m;
}

async function extendProvenance(head: Memory, input: CreateInput): Promise<Memory> {
  const merged = uniq([...head.sourceBlockIds, ...input.sourceBlockIds]);
  const patch: Partial<Memory> = {
    sourceBlockIds: merged,
    evidenceCount: merged.length,
    confidence: Math.min(1, Math.max(head.confidence, input.confidence)),
    updatedAt: Date.now(),
  };
  await db.memories.update(head.id, patch);
  return { ...head, ...patch } as Memory;
}

async function doSupersede(
  old: Memory,
  input: CreateInput,
  subject: string,
): Promise<Memory> {
  const now = Date.now();
  const sourceBlockIds = uniq(input.sourceBlockIds);
  const next: Memory = {
    id: ulid(now),
    tier: input.tier,
    subject,
    subjectLabel: input.subjectLabel,
    statement: input.statement.trim(),
    confidence: clamp01(input.confidence),
    evidenceCount: sourceBlockIds.length,
    sourceBlockIds,
    createdAt: now,
    updatedAt: now,
    supersededBy: null,
    archivedAt: null,
    isHead: 1,
  };
  await db.transaction('rw', db.memories, async () => {
    await db.memories.update(old.id, {
      isHead: 0,
      supersededBy: next.id,
      updatedAt: now,
    });
    await db.memories.add(next);
  });
  return next;
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0.5;
  return Math.min(1, Math.max(0, x));
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr));
}
