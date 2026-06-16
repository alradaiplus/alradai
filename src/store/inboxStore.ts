'use client';

import { create } from 'zustand';

import { archiveBlock, createBlock, fileFromInbox, listInbox } from '@/src/core/db';
import type { Block } from '@/src/core/types';

type InboxStore = {
  ready: boolean;
  blocks: Block[];
  focusIdx: number;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  capture: (text: string, opts?: { source?: Block['source'] }) => Promise<Block>;
  file: (id: string, tags?: string[]) => Promise<void>;
  archive: (id: string) => Promise<void>;
  focusNext: () => void;
  focusPrev: () => void;
};

export const useInbox = create<InboxStore>((set, get) => ({
  ready: false,
  blocks: [],
  focusIdx: 0,
  hydrate: async () => {
    const blocks = await listInbox();
    set({ blocks, ready: true, focusIdx: 0 });
  },
  refresh: async () => {
    const blocks = await listInbox();
    set({ blocks, focusIdx: Math.min(get().focusIdx, Math.max(0, blocks.length - 1)) });
  },
  capture: async (text, opts) => {
    const block = await createBlock({
      body: text,
      source: opts?.source ?? 'capture',
      inbox: true,
    });
    await get().refresh();
    return block;
  },
  file: async (id, tags = []) => {
    await fileFromInbox(id, tags);
    await get().refresh();
  },
  archive: async (id) => {
    await archiveBlock(id);
    await get().refresh();
  },
  focusNext: () => set({ focusIdx: Math.min(get().blocks.length - 1, get().focusIdx + 1) }),
  focusPrev: () => set({ focusIdx: Math.max(0, get().focusIdx - 1) }),
}));
