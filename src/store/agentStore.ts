'use client';

import { create } from 'zustand';

import type { Block } from '@/src/core/types';
import { recall } from '@/src/ai/features/recall';
import { runSynthesisIfDue } from '@/src/ai/features/synthesis';
import {
  listCurrentWeekThreads,
  runThreadDiscoveryIfDue,
} from '@/src/ai/features/thread';
import { db, monthlySpendUsd } from '@/src/core/db';

type AgentStore = {
  recall: Block[];
  morningParagraphId: string | null;
  threads: Block[];
  monthlyUsd: number;
  refreshRecall: (seed: string) => Promise<void>;
  refreshMorning: () => Promise<void>;
  refreshSpend: () => Promise<void>;
  refreshThreads: () => Promise<void>;
  triggerSynthesis: () => Promise<void>;
  triggerThreadDiscovery: () => Promise<void>;
};

export const useAgent = create<AgentStore>((set) => ({
  recall: [],
  morningParagraphId: null,
  threads: [],
  monthlyUsd: 0,
  refreshRecall: async (seed) => {
    const blocks = await recall(seed, 3);
    set({ recall: blocks });
  },
  refreshMorning: async () => {
    const today = await db.blocks
      .where('source')
      .equals('agent')
      .reverse()
      .sortBy('createdAt');
    const synth = today.find((b) => b.tags.includes('synthesis'));
    set({ morningParagraphId: synth?.id ?? null });
  },
  refreshSpend: async () => {
    const usd = await monthlySpendUsd();
    set({ monthlyUsd: usd });
  },
  refreshThreads: async () => {
    const threads = await listCurrentWeekThreads();
    set({ threads });
  },
  triggerSynthesis: async () => {
    await runSynthesisIfDue();
  },
  triggerThreadDiscovery: async () => {
    await runThreadDiscoveryIfDue();
  },
}));
