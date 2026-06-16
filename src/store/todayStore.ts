'use client';

import { create } from 'zustand';

import {
  createBlock,
  listCommitments,
  listToday,
  toggleCommitment,
  updateBlockBody,
  upsertCommitment,
} from '@/src/core/db';
import { endOfDay, isoDate, startOfDay } from '@/src/core/time';
import type { Block, Commitment } from '@/src/core/types';

type TodayStore = {
  ready: boolean;
  date: string;
  draft: string;
  draftBlockId: string | null;
  blocks: Block[];
  commitments: Commitment[];
  hydrate: () => Promise<void>;
  setDraft: (s: string) => void;
  flushDraft: () => Promise<Block | null>;
  endBlock: () => Promise<void>;
  setCommitment: (slot: 1 | 2 | 3, text: string) => Promise<void>;
  toggle: (slot: 1 | 2 | 3) => Promise<void>;
  refresh: () => Promise<void>;
};

export const useToday = create<TodayStore>((set, get) => ({
  ready: false,
  date: isoDate(),
  draft: '',
  draftBlockId: null,
  blocks: [],
  commitments: [],
  hydrate: async () => {
    const date = isoDate();
    const [blocks, commitments] = await Promise.all([
      listToday(startOfDay(), endOfDay()),
      listCommitments(date),
    ]);
    set({ ready: true, date, blocks, commitments });
  },
  refresh: async () => {
    const [blocks, commitments] = await Promise.all([
      listToday(startOfDay(), endOfDay()),
      listCommitments(get().date),
    ]);
    set({ blocks, commitments });
  },
  setDraft: (s) => set({ draft: s }),
  flushDraft: async () => {
    const body = get().draft.trim();
    const id = get().draftBlockId;
    if (!body && !id) return null;
    if (id) {
      const updated = await updateBlockBody(id, body);
      if (updated) await get().refresh();
      return updated ?? null;
    }
    const block = await createBlock({ body, source: 'manual' });
    set({ draftBlockId: block.id });
    await get().refresh();
    return block;
  },
  endBlock: async () => {
    await get().flushDraft();
    set({ draft: '', draftBlockId: null });
  },
  setCommitment: async (slot, text) => {
    await upsertCommitment(get().date, slot, text);
    await get().refresh();
  },
  toggle: async (slot) => {
    await toggleCommitment(get().date, slot);
    await get().refresh();
  },
}));
