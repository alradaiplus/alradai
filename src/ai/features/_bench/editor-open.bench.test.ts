// Editor-open p95 benchmark.
//
// Simulates the load Phase A is expected to absorb:
//   5,000 blocks
//   1,000 memories
//     300 positions
//      50 supersession chains (chain depth 2..4)
//
// Asserts the three queries the editor fires on open
// (block + backlinks + contradictions) finish under budget at p95.

import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';

import { db } from '@/src/core/db';
import { contradictionsForBlock } from '@/src/ai/features/contradiction';
import { ulid } from '@/src/core/ids';
import type { Block } from '@/src/core/types';
import type { Memory } from '@/src/core/memory/types';

const N_BLOCKS = 5_000;
const N_MEMORIES = 1_000;
const N_POSITIONS = 300;
const N_CHAINS = 50;

let sampledBlockIds: string[] = [];

beforeAll(async () => {
  await seedCorpus();
}, 120_000);

describe('Editor-open latency on a large corpus', () => {
  it('p95 < 50 ms over 200 sampled blocks', async () => {
    const samples = pickSampleIds(200);
    const durations: number[] = [];

    for (const id of samples) {
      const t = performance.now();
      // The three queries the BlockEditorSheet fires on open.
      await Promise.all([
        db.blocks.get(id),
        db.blocks.where('links').equals(id).filter((x) => !x.archivedAt).toArray(),
        contradictionsForBlock(id),
      ]);
      durations.push(performance.now() - t);
    }

    const sorted = durations.slice().sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const max = sorted[sorted.length - 1];

    // eslint-disable-next-line no-console
    console.log(
      `[editor-open] p50=${p50.toFixed(2)}ms  p95=${p95.toFixed(2)}ms  max=${max.toFixed(2)}ms  n=${durations.length}`,
    );

    expect(p95).toBeLessThan(50);
  });

  it('p95 contradiction lookup alone < 20 ms', async () => {
    const samples = pickSampleIds(200);
    const durations: number[] = [];
    for (const id of samples) {
      const t = performance.now();
      await contradictionsForBlock(id);
      durations.push(performance.now() - t);
    }
    const sorted = durations.slice().sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    // eslint-disable-next-line no-console
    console.log(`[contradiction] p95=${p95.toFixed(2)}ms n=${durations.length}`);
    expect(p95).toBeLessThan(20);
  });
});

// ── seeding ─────────────────────────────────────────────────

function pickSampleIds(n: number): string[] {
  // Bias 60% toward the blocks that have contradictions wired up so
  // we exercise the worst case rather than the empty path.
  const positives = sampledBlockIds;
  const all = positives.concat(positives); // dummy to seed shape
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    const pickPositive = i % 5 < 3 && positives.length > 0;
    ids.push(
      pickPositive
        ? positives[i % positives.length]
        : `B${(i * 17) % N_BLOCKS}`,
    );
  }
  return ids;
}

async function seedCorpus() {
  const now = Date.now();

  // Blocks. Synthetic IDs so we can refer to them deterministically.
  const blocks: Block[] = [];
  for (let i = 0; i < N_BLOCKS; i++) {
    const id = `B${i}`;
    const body = `Block ${i} concerning topic ${i % 200}`;
    blocks.push({
      id,
      body,
      createdAt: now - i * 60_000,
      updatedAt: now - i * 60_000,
      source: 'manual',
      tags: [`t${i % 200}`],
      links: i % 7 === 0 ? [`B${(i + 1) % N_BLOCKS}`] : [],
      attachments: [],
      tokens: body.toLowerCase().split(' '),
      inbox: 0,
    });
  }
  await db.blocks.bulkAdd(blocks);

  // Memories: 700 non-position, 300 positions. Chain 50 of the
  // positions through 2-4 superseded ancestors each, recording the
  // 'current' block as a source.
  const memories: Memory[] = [];

  for (let i = 0; i < N_MEMORIES - N_POSITIONS; i++) {
    memories.push(stubMemory(`M-i${i}`, 'identity', `subj-i${i}`, now, [`B${i}`]));
  }

  // 300 positions; first N_CHAINS will receive ancestors below.
  for (let i = 0; i < N_POSITIONS; i++) {
    const blockId = `B${(i * 13) % N_BLOCKS}`;
    memories.push(
      stubMemory(`M-p${i}`, 'position', `pos-${i}`, now - i * 1_000, [blockId]),
    );
    if (i < N_CHAINS) sampledBlockIds.push(blockId);
  }

  // Build supersession chains: for the first N_CHAINS positions,
  // create 2-4 superseded ancestors.
  const ancestors: Memory[] = [];
  for (let i = 0; i < N_CHAINS; i++) {
    const head = memories[N_MEMORIES - N_POSITIONS + i]; // the position
    const depth = 2 + (i % 3); // 2..4 total chain length
    let supersededBy = head.id;
    for (let d = 1; d < depth; d++) {
      const id = `M-anc-${i}-${d}`;
      const ancestor = stubMemory(
        id,
        'position',
        head.subject,
        head.createdAt - d * 86_400_000,
        [`B${(i * 31 + d) % N_BLOCKS}`],
      );
      ancestor.isHead = 0;
      ancestor.supersededBy = supersededBy;
      ancestors.push(ancestor);
      supersededBy = id;
    }
  }

  await db.memories.bulkAdd(memories);
  await db.memories.bulkAdd(ancestors);
}

function stubMemory(
  id: string,
  tier: Memory['tier'],
  subject: string,
  now: number,
  sourceBlockIds: string[],
): Memory {
  return {
    id,
    tier,
    subject,
    subjectLabel: subject,
    statement: `claim about ${subject}`,
    confidence: 0.7,
    evidenceCount: sourceBlockIds.length,
    sourceBlockIds,
    createdAt: now,
    updatedAt: now,
    supersededBy: null,
    archivedAt: null,
    isHead: 1,
  };
}
