'use client';

import { useEffect } from 'react';

type Mod = 'cmd' | 'shift' | 'alt' | 'ctrl';

function isMac() {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad/.test(navigator.platform);
}

function matches(e: KeyboardEvent, key: string, mods: Mod[]) {
  const wantCmd = mods.includes('cmd');
  const wantShift = mods.includes('shift');
  const wantAlt = mods.includes('alt');
  const wantCtrl = mods.includes('ctrl');
  const cmd = isMac() ? e.metaKey : e.ctrlKey;
  if (wantCmd !== cmd) return false;
  if (wantShift !== e.shiftKey) return false;
  if (wantAlt !== e.altKey) return false;
  // ctrl on mac when ⌘ isn't requested
  if (wantCtrl && !e.ctrlKey) return false;
  return e.key.toLowerCase() === key.toLowerCase();
}

export function useHotkey(
  combo: string,
  fn: (e: KeyboardEvent) => void,
  opts: { allowInInputs?: boolean } = {},
) {
  useEffect(() => {
    const parts = combo.toLowerCase().split('+');
    const key = parts.pop() ?? '';
    const mods = parts as Mod[];
    function handler(e: KeyboardEvent) {
      if (!opts.allowInInputs) {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName;
        const editable = (t as HTMLElement | null)?.isContentEditable;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || editable) {
          // allow ⌘-based shortcuts inside inputs
          const isCmd = isMac() ? e.metaKey : e.ctrlKey;
          if (!isCmd) return;
        }
      }
      if (matches(e, key, mods)) {
        e.preventDefault();
        fn(e);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [combo, fn, opts.allowInInputs]);
}
