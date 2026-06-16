// ─────────────────────────────────────────────────────────────
// Dexie schema. Local-first. IndexedDB today, swap for native
// SQLite under Tauri/RN without changing this API.
// ─────────────────────────────────────────────────────────────

import Dexie, { type Table } from 'dexie';

import type {
  AgentRun,
  Block,
  Commitment,
  Embedding,
  SettingsState,
} from './types';
import { DEFAULT_SETTINGS } from './types';
import { extractLinks, extractTags, tokenize } from './text';
import { ulid } from './ids';
import type { Memory } from './memory/types';

class NoterDB extends Dexie {
  blocks!: Table<Block, string>;
  commitments!: Table<Commitment, string>;
  agentRuns!: Table<AgentRun, string>;
  embeddings!: Table<{ blockId: string; vector: ArrayBuffer; dim: number }, string>;
  kv!: Table<{ key: string; value: unknown }, string>;
  // v2 — memory substrate
  memories!: Table<Memory, string>;
  memoryEmbeddings!: Table<
    { memoryId: string; vector: ArrayBuffer; dim: number },
    string
  >;

  constructor() {
    super('noter');
    this.version(1).stores({
      // multi-entry indexes on tags / tokens for O(log n) lookups
      blocks:
        'id, createdAt, updatedAt, source, archivedAt, inbox, *tags, *tokens, *links',
      commitments: 'id, [date+slot], date',
      agentRuns: 'id, kind, ranAt, ok',
      embeddings: 'blockId',
      kv: 'key',
    });
    // v2 — additive only. Existing data is untouched.
    this.version(2).stores({
      memories:
        'id, tier, subject, isHead, createdAt, updatedAt, archivedAt, [tier+isHead], [tier+subject+isHead]',
      memoryEmbeddings: 'memoryId',
    });
  }
}

export const db = new NoterDB();

// ─── Settings ──────────────────────────────────────────────

const SETTINGS_KEY = 'settings';

export async function readSettings(): Promise<SettingsState> {
  const row = await db.kv.get(SETTINGS_KEY);
  if (!row) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(row.value as Partial<SettingsState>) };
}

export async function writeSettings(s: SettingsState): Promise<void> {
  await db.kv.put({ key: SETTINGS_KEY, value: s });
}

// ─── Blocks ────────────────────────────────────────────────

type CreateBlockInput = {
  body: string;
  source?: Block['source'];
  inbox?: boolean;
  tags?: string[];
  links?: string[];
};

export async function createBlock(input: CreateBlockInput): Promise<Block> {
  const now = Date.now();
  const id = ulid(now);
  const tags = Array.from(
    new Set([...(input.tags ?? []), ...extractTags(input.body)]),
  );
  const links = Array.from(
    new Set([...(input.links ?? []), ...extractLinks(input.body)]),
  );
  const block: Block = {
    id,
    body: input.body,
    createdAt: now,
    updatedAt: now,
    source: input.source ?? 'manual',
    tags,
    links,
    attachments: [],
    tokens: tokenize(input.body),
    inbox: input.inbox ? 1 : 0,
  };
  await db.blocks.add(block);
  return block;
}

export async function updateBlockBody(id: string, body: string): Promise<Block | undefined> {
  const b = await db.blocks.get(id);
  if (!b) return;
  const tags = Array.from(new Set([...extractTags(body)]));
  const links = Array.from(new Set([...extractLinks(body)]));
  const tokens = tokenize(body);
  const patch: Partial<Block> = {
    body,
    tags,
    links,
    tokens,
    updatedAt: Date.now(),
  };
  await db.blocks.update(id, patch);
  return { ...b, ...patch } as Block;
}

export async function archiveBlock(id: string): Promise<void> {
  await db.blocks.update(id, { archivedAt: Date.now() });
}

export async function fileFromInbox(id: string, tags: string[]): Promise<void> {
  const b = await db.blocks.get(id);
  if (!b) return;
  const merged = Array.from(new Set([...b.tags, ...tags]));
  await db.blocks.update(id, { inbox: 0, tags: merged, updatedAt: Date.now() });
}

export async function getBlock(id: string): Promise<Block | undefined> {
  return db.blocks.get(id);
}

export async function listToday(dayStart: number, dayEnd: number): Promise<Block[]> {
  return db.blocks
    .where('createdAt')
    .between(dayStart, dayEnd, true, true)
    .filter((b) => !b.archivedAt && b.inbox !== 1)
    .reverse()
    .sortBy('createdAt');
}

export async function listInbox(): Promise<Block[]> {
  return db.blocks
    .where('inbox')
    .equals(1)
    .filter((b) => !b.archivedAt)
    .reverse()
    .sortBy('createdAt');
}

export async function listByTag(tag: string, limit = 100): Promise<Block[]> {
  return db.blocks
    .where('tags')
    .equals(tag.toLowerCase())
    .filter((b) => !b.archivedAt)
    .reverse()
    .sortBy('createdAt')
    .then((arr) => arr.slice(0, limit));
}

export async function searchBlocks(query: string, limit = 30): Promise<Block[]> {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  // Intersection of tokens — fast, multi-entry index
  let candidates: Block[] | null = null;
  for (const t of terms) {
    const hits = await db.blocks.where('tokens').equals(t).toArray();
    candidates = candidates
      ? hits.filter((b) => candidates!.some((c) => c.id === b.id))
      : hits;
    if (candidates.length === 0) return [];
  }
  const arr = (candidates ?? []).filter((b) => !b.archivedAt);
  arr.sort((a, b) => b.updatedAt - a.updatedAt);
  return arr.slice(0, limit);
}

export async function countAll(): Promise<number> {
  return db.blocks.where('archivedAt').equals(undefined as unknown as number).count();
}

// ─── Commitments ───────────────────────────────────────────

export async function listCommitments(date: string): Promise<Commitment[]> {
  return db.commitments.where('date').equals(date).sortBy('slot');
}

export async function upsertCommitment(date: string, slot: 1 | 2 | 3, text: string): Promise<void> {
  const existing = await db.commitments.where('[date+slot]').equals([date, slot]).first();
  const now = Date.now();
  if (existing) {
    await db.commitments.update(existing.id, { text, updatedAt: now });
  } else {
    await db.commitments.add({
      id: ulid(now),
      date,
      slot,
      text,
      done: 0,
      updatedAt: now,
    });
  }
}

export async function toggleCommitment(date: string, slot: 1 | 2 | 3): Promise<void> {
  const existing = await db.commitments.where('[date+slot]').equals([date, slot]).first();
  if (!existing) return;
  await db.commitments.update(existing.id, {
    done: existing.done ? 0 : 1,
    updatedAt: Date.now(),
  });
}

// ─── Embeddings ────────────────────────────────────────────

export async function saveEmbedding(blockId: string, e: Embedding): Promise<void> {
  const buf = new ArrayBuffer(e.byteLength);
  new Float32Array(buf).set(e);
  await db.embeddings.put({ blockId, vector: buf, dim: e.length });
}

export async function readAllEmbeddings(): Promise<Array<{ id: string; v: Embedding }>> {
  const all = await db.embeddings.toArray();
  return all.map((r) => ({ id: r.blockId, v: new Float32Array(r.vector) }));
}

// ─── Agent runs ────────────────────────────────────────────

export async function logRun(run: Omit<AgentRun, 'id'>): Promise<void> {
  await db.agentRuns.add({ id: ulid(), ...run });
}

export async function monthlySpendUsd(): Promise<number> {
  const start = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const rows = await db.agentRuns.where('ranAt').above(start).toArray();
  return rows.reduce((s, r) => s + (r.costUsd ?? 0), 0);
}

export async function lastRun(kind: AgentRun['kind']): Promise<AgentRun | undefined> {
  const arr = await db.agentRuns.where('kind').equals(kind).reverse().sortBy('ranAt');
  return arr[0];
}
