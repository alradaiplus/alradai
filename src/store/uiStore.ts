'use client';

import { create } from 'zustand';

type Overlay = null | 'capture' | 'command' | 'settings' | 'editor';

type Toast = { id: string; text: string; until: number };

type UIStore = {
  overlay: Overlay;
  editorBlockId: string | null;
  surface: 'today' | 'canvas' | 'inbox';
  toasts: Toast[];
  open: (o: Overlay) => void;
  close: () => void;
  openEditor: (blockId: string) => void;
  setSurface: (s: UIStore['surface']) => void;
  toast: (text: string, ms?: number) => void;
  dismissToast: (id: string) => void;
};

let toastIdCounter = 0;

export const useUI = create<UIStore>((set, get) => ({
  overlay: null,
  editorBlockId: null,
  surface: 'today',
  toasts: [],
  open: (o) => set({ overlay: o }),
  close: () => set({ overlay: null, editorBlockId: null }),
  openEditor: (blockId) => set({ overlay: 'editor', editorBlockId: blockId }),
  setSurface: (s) => set({ surface: s }),
  toast: (text, ms = 3200) => {
    const id = `t${++toastIdCounter}`;
    const until = Date.now() + ms;
    set({ toasts: [...get().toasts, { id, text, until }] });
    setTimeout(() => get().dismissToast(id), ms);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
