'use client';

import { create } from 'zustand';

import type { Block } from '@/src/core/types';
import { recall } from '@/src/ai/features/recall';
import { runSynthesisIfDue, type SynthesisOutcome } from '@/src/ai/features/synthesis';
import {
  listCurrentWeekThreads,
  runThreadDiscoveryIfDue,
  type ThreadOutcome,
} from '@/src/ai/features/thread';
import { db, monthlySpendUsd } from '@/src/core/db';

type AgentStore = {
  recall: Block[];
  morningParagraphId: string | null;
  threads: Block[];
  monthlyUsd: number;
  /** Live while the synthesis call is in flight. Drives the Morning Paragraph "running" state. */
  synthesisRunning: boolean;
  /** Most recent synthesis outcome — drives Morning Paragraph state copy. */
  lastSynthesis: SynthesisOutcome | null;
  /** Most recent thread discovery outcome — used by Settings → Agent Activity. */
  lastThread: ThreadOutcome | null;

  refreshRecall: (seed: string) => Promise<void>;
  refreshMorning: () => Promise<void>;
  refreshSpend: () => Promise<void>;
  refreshThreads: () => Promise<void>;
  triggerSynthesis: () => Promise<SynthesisOutcome>;
  triggerThreadDiscovery: () => Promise<ThreadOutcome>;
};

export const useAgent = create<AgentStore>((set) => ({
  recall: [],
  morningParagraphId: null,
  threads: [],
  monthlyUsd: 0,
  synthesisRunning: false,
  lastSynthesis: null,
  lastThread: null,

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
    set({ synthesisRunning: true });
    const outcome = await runSynthesisIfDue();
    set({ synthesisRunning: false, lastSynthesis: outcome });
    return outcome;
  },
  triggerThreadDiscovery: async () => {
    const outcome = await runThreadDiscoveryIfDue();
    set({ lastThread: outcome });
    return outcome;
  },
}));
