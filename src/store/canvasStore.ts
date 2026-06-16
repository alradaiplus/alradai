'use client';

import { create } from 'zustand';

import { db, listByTag, searchBlocks } from '@/src/core/db';
import { parseQuery } from '@/src/core/query';
import type { Block } from '@/src/core/types';

type CanvasStore = {
  query: string;
  results: Block[];
  loading: boolean;
  savedQueries: { id: string; label: string; query: string }[];
  setQuery: (q: string) => void;
  run: () => Promise<void>;
  saveCurrentAs: (label: string) => void;
};

const SEED_SAVED = [
  { id: 'open-questions', label: 'Open Questions', query: 'is:question' },
  { id: 'today', label: 'Today', query: 'is:today' },
];

export const useCanvas = create<CanvasStore>((set, get) => ({
  query: '',
  results: [],
  loading: false,
  savedQueries: SEED_SAVED,
  setQuery: (q) => set({ query: q }),
  run: async () => {
    const q = get().query.trim();
    set({ loading: true });
    if (!q) {
      const all = await db.blocks.orderBy('createdAt').reverse().limit(80).toArray();
      set({ results: all.filter((b) => !b.archivedAt), loading: false });
      return;
    }
    const parsed = parseQuery(q);
    let acc: Block[] | null = null;

    if (parsed.tags.length > 0) {
      for (const tag of parsed.tags) {
        const hits = await listByTag(tag, 500);
        acc = acc ? hits.filter((h) => acc!.some((a) => a.id === h.id)) : hits;
      }
    }
    if (parsed.text.length > 0) {
      const hits = await searchBlocks(parsed.text.join(' '), 200);
      acc = acc ? hits.filter((h) => acc!.some((a) => a.id === h.id)) : hits;
    }
    if (parsed.is.includes('question')) {
      const hits = await listByTag('?', 500);
      acc = acc ? hits.filter((h) => acc!.some((a) => a.id === h.id)) : hits;
    }
    if (parsed.is.includes('done')) {
      const hits = await listByTag('done', 500);
      acc = acc ? hits.filter((h) => acc!.some((a) => a.id === h.id)) : hits;
    }
    if (acc === null) {
      acc = await db.blocks.orderBy('createdAt').reverse().limit(80).toArray();
    }
    if (parsed.before) acc = acc.filter((b) => b.createdAt < parsed.before!);
    if (parsed.after) acc = acc.filter((b) => b.createdAt > parsed.after!);
    set({ results: acc.filter((b) => !b.archivedAt), loading: false });
  },
  saveCurrentAs: (label) => {
    const id = label.toLowerCase().replace(/\W+/g, '-');
    set({
      savedQueries: [
        ...get().savedQueries,
        { id, label, query: get().query },
      ],
    });
  },
}));
