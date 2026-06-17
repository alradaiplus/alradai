'use client';

import { create } from 'zustand';

type Overlay = null | 'capture' | 'command' | 'settings' | 'editor';

type Toast = { id: string; text: string; until: number };

export type Surface = 'today' | 'canvas' | 'inbox' | 'board';

/** Reversible record of the most recent capture, for ⌘Z undo. */
export type LastCapture = {
  blockId: string;
  at: number;
};

type UIStore = {
  overlay: Overlay;
  editorBlockId: string | null;
  surface: Surface;
  /** id of the board to render when surface === 'board' */
  activeBoardId: string | null;
  /** the last captured block, available for ⌘Z within UNDO_WINDOW_MS */
  lastCapture: LastCapture | null;
  toasts: Toast[];
  open: (o: Overlay) => void;
  close: () => void;
  openEditor: (blockId: string) => void;
  setSurface: (s: Surface) => void;
  openBoard: (boardId: string) => void;
  recordCapture: (blockId: string) => void;
  consumeCapture: () => LastCapture | null;
  toast: (text: string, ms?: number) => void;
  dismissToast: (id: string) => void;
};

export const UNDO_WINDOW_MS = 5_000;

let toastIdCounter = 0;

export const useUI = create<UIStore>((set, get) => ({
  overlay: null,
  editorBlockId: null,
  surface: 'today',
  activeBoardId: null,
  lastCapture: null,
  toasts: [],
  open: (o) => set({ overlay: o }),
  close: () => set({ overlay: null, editorBlockId: null }),
  openEditor: (blockId) => set({ overlay: 'editor', editorBlockId: blockId }),
  setSurface: (s) => set({ surface: s }),
  openBoard: (boardId) => set({ surface: 'board', activeBoardId: boardId, overlay: null }),
  recordCapture: (blockId) => set({ lastCapture: { blockId, at: Date.now() } }),
  consumeCapture: () => {
    const c = get().lastCapture;
    if (!c) return null;
    if (Date.now() - c.at > UNDO_WINDOW_MS) {
      set({ lastCapture: null });
      return null;
    }
    set({ lastCapture: null });
    return c;
  },
  toast: (text, ms = 3200) => {
    const id = `t${++toastIdCounter}`;
    const until = Date.now() + ms;
    set({ toasts: [...get().toasts, { id, text, until }] });
    setTimeout(() => get().dismissToast(id), ms);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
