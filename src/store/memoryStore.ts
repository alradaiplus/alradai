'use client';

import { create } from 'zustand';

import {
  assertMemory,
  countMemories,
  deleteMemory,
  listMemories,
  repairEvidenceCounts,
  searchMemory,
  supersedeMemory,
} from '@/src/core/memory/memory';
import type { Memory, MemoryTier } from '@/src/core/memory/types';
import { retrieveMemories } from '@/src/ai/features/memory';

type MemoryStore = {
  ready: boolean;
  count: number;
  recent: Memory[];
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  search: (q: string) => Promise<Memory[]>;
  recall: (seed: string, k?: number) => Promise<Memory[]>;
  assertMemory: (input: {
    tier: MemoryTier;
    subjectLabel: string;
    statement: string;
    confidence: number;
    sourceBlockIds: string[];
  }) => Promise<Memory>;
  supersedeMemory: (
    replacesId: string,
    next: Parameters<typeof assertMemory>[0],
  ) => Promise<Memory | undefined>;
  deleteMemory: (id: string) => Promise<void>;
};

export const useMemory = create<MemoryStore>((set, get) => ({
  ready: false,
  count: 0,
  recent: [],

  load: async () => {
    void repairEvidenceCounts();
    const [count, recent] = await Promise.all([
      countMemories(),
      listMemories({ limit: 50 }),
    ]);
    set({ ready: true, count, recent });
  },

  refresh: async () => {
    const [count, recent] = await Promise.all([
      countMemories(),
      listMemories({ limit: 50 }),
    ]);
    set({ count, recent });
  },

  search: async (q) => searchMemory(q, 100),

  recall: async (seed, k = 5) => {
    const ranked = await retrieveMemories(seed, k);
    return ranked.map((r) => r.item);
  },

  assertMemory: async (input) => {
    const m = await assertMemory(input);
    await get().refresh();
    return m;
  },

  supersedeMemory: async (replacesId, next) => {
    const m = await supersedeMemory(replacesId, next);
    await get().refresh();
    return m;
  },

  deleteMemory: async (id) => {
    await deleteMemory(id);
    await get().refresh();
  },
}));
