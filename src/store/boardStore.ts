'use client';

import { create } from 'zustand';

import { deleteBoard, getBoard, listActiveBoards, touchBoard } from '@/src/core/boards/boards';
import type { Board, BoardEdge, BoardNode } from '@/src/core/boards/types';
import { generateBoard } from '@/src/ai/features/board';

type Status = 'idle' | 'generating' | 'loading' | 'ready' | 'error';

export type GenerateOutcome =
  | { ok: true; boardId: string }
  | {
      ok: false;
      reason: 'no-candidates' | 'no-key' | 'error';
      message: string;
    };

type BoardStore = {
  status: Status;
  errorMessage: string | null;
  currentBoardId: string | null;
  board: Board | null;
  nodes: BoardNode[];
  edges: BoardEdge[];
  recent: Board[];
  refreshRecent: () => Promise<void>;
  load: (id: string) => Promise<void>;
  generate: (topic: string) => Promise<GenerateOutcome>;
  delete: (id: string) => Promise<void>;
  reset: () => void;
};

export const useBoard = create<BoardStore>((set, get) => ({
  status: 'idle',
  errorMessage: null,
  currentBoardId: null,
  board: null,
  nodes: [],
  edges: [],
  recent: [],

  refreshRecent: async () => {
    const recent = await listActiveBoards();
    set({ recent });
  },

  load: async (id) => {
    set({ status: 'loading', currentBoardId: id, errorMessage: null });
    const res = await getBoard(id);
    if (!res) {
      set({ status: 'error', errorMessage: 'Board not found' });
      return;
    }
    await touchBoard(id);
    set({
      status: 'ready',
      board: res.board,
      nodes: res.nodes,
      edges: res.edges,
    });
  },

  generate: async (topic) => {
    set({ status: 'generating', errorMessage: null });
    try {
      const generated = await generateBoard(topic);
      if (!generated) {
        // The only path that returns null is candidates < 4 — the true
        // "not enough material" case. All other failures throw.
        const message = 'Not enough material on this topic yet.';
        set({ status: 'idle', errorMessage: message });
        return { ok: false, reason: 'no-candidates', message };
      }
      await get().load(generated.board.id);
      await get().refreshRecent();
      return { ok: true, boardId: generated.board.id };
    } catch (e) {
      const message = (e as Error).message || 'Board generation failed.';
      const reason: 'no-key' | 'error' = /no api key/i.test(message)
        ? 'no-key'
        : 'error';
      set({ status: 'error', errorMessage: message });
      return { ok: false, reason, message };
    }
  },

  delete: async (id) => {
    await deleteBoard(id);
    if (get().currentBoardId === id) get().reset();
    await get().refreshRecent();
  },

  reset: () =>
    set({
      status: 'idle',
      currentBoardId: null,
      board: null,
      nodes: [],
      edges: [],
      errorMessage: null,
    }),
}));
