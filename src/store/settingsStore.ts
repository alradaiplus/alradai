'use client';

import { create } from 'zustand';

import { readSettings, writeSettings } from '@/src/core/db';
import { DEFAULT_SETTINGS, type SettingsState } from '@/src/core/types';

type SettingsStore = {
  ready: boolean;
  settings: SettingsState;
  hydrate: () => Promise<void>;
  patch: (patch: Partial<SettingsState>) => Promise<void>;
  patchModel: (key: keyof SettingsState['models'], value: string) => Promise<void>;
};

export const useSettings = create<SettingsStore>((set, get) => ({
  ready: false,
  settings: DEFAULT_SETTINGS,
  hydrate: async () => {
    const s = await readSettings();
    set({ settings: s, ready: true });
  },
  patch: async (patch) => {
    const merged = { ...get().settings, ...patch };
    set({ settings: merged });
    await writeSettings(merged);
  },
  patchModel: async (key, value) => {
    const cur = get().settings;
    const merged: SettingsState = {
      ...cur,
      models: { ...cur.models, [key]: value },
    };
    set({ settings: merged });
    await writeSettings(merged);
  },
}));
