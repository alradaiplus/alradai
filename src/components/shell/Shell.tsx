'use client';

import { useEffect } from 'react';

import { Header } from './Header';
import { FAB } from './FAB';
import { Toaster } from './Toaster';
import { TodaySurface } from '@/src/components/surfaces/TodaySurface';
import { CanvasSurface } from '@/src/components/surfaces/CanvasSurface';
import { InboxSurface } from '@/src/components/surfaces/InboxSurface';
import { CaptureOverlay } from '@/src/components/overlays/CaptureOverlay';
import { CommandBar } from '@/src/components/overlays/CommandBar';
import { SettingsSheet } from '@/src/components/overlays/SettingsSheet';
import { BlockEditorSheet } from '@/src/components/overlays/BlockEditorSheet';
import { useHotkey } from '@/src/hooks/useHotkey';
import { useSettings } from '@/src/store/settingsStore';
import { useInbox } from '@/src/store/inboxStore';
import { useMemory } from '@/src/store/memoryStore';
import { useUI } from '@/src/store/uiStore';
import { backfillEmbeddings } from '@/src/ai/embeddings';
import { onTauriEvent } from '@/src/core/tauri';

export function Shell() {
  const settingsReady = useSettings((s) => s.ready);
  const settings = useSettings((s) => s.settings);
  const hydrateSettings = useSettings((s) => s.hydrate);
  const hydrateInbox = useInbox((s) => s.hydrate);
  const loadMemory = useMemory((s) => s.load);

  const overlay = useUI((s) => s.overlay);
  const surface = useUI((s) => s.surface);
  const open = useUI((s) => s.open);
  const close = useUI((s) => s.close);
  const setSurface = useUI((s) => s.setSurface);

  // Hydrate, prompt for key, backfill embeddings.
  useEffect(() => {
    void hydrateSettings();
    void hydrateInbox();
    void loadMemory();
  }, [hydrateSettings, hydrateInbox, loadMemory]);

  useEffect(() => {
    if (!settingsReady) return;
    void backfillEmbeddings();
    if (!settings.apiKey) open('settings');
  }, [settingsReady, settings.apiKey, open]);

  // Tauri global shortcut bridge: ⌘⇧Space routes through here.
  useEffect(() => {
    let off: () => void = () => {};
    void onTauriEvent('nc:capture', () => open('capture')).then((u) => (off = u));
    return () => off();
  }, [open]);

  // Global hotkeys
  useHotkey('cmd+k', () => open(overlay === 'command' ? null : 'command'), {
    allowInInputs: true,
  });
  useHotkey('cmd+,', () => open(overlay === 'settings' ? null : 'settings'), {
    allowInInputs: true,
  });
  useHotkey('cmd+shift+ ', () => open(overlay === 'capture' ? null : 'capture'), {
    allowInInputs: true,
  });
  useHotkey('g', () => {
    if (overlay) return;
    // sequence-key skipped for v1 — direct shortcuts:
  });
  useHotkey('cmd+1', () => {
    if (!overlay) setSurface('today');
  });
  useHotkey('cmd+2', () => {
    if (!overlay) setSurface('canvas');
  });
  useHotkey('cmd+3', () => {
    if (!overlay) setSurface('inbox');
  });

  return (
    <div className="nc-shell">
      <Header />
      {surface === 'today' ? <TodaySurface /> : null}
      {surface === 'canvas' ? <CanvasSurface /> : null}
      {surface === 'inbox' ? <InboxSurface /> : null}

      <FAB />
      <Toaster />

      {overlay === 'capture' ? <CaptureOverlay /> : null}
      {overlay === 'command' ? <CommandBar /> : null}
      {overlay === 'settings' ? <SettingsSheet /> : null}
      {overlay === 'editor' ? <BlockEditorSheet /> : null}
    </div>
  );
}
