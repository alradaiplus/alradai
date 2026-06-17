'use client';

import { useEffect, useState } from 'react';

// Map Mac glyphs to their platform-correct strings. Bindings already
// adapt via useHotkey; this fixes the *display* so Windows / Linux
// users don't think the app is Mac-only on first launch.
const MAC_TO_PC: Record<string, string> = {
  '⌘': 'Ctrl',
  '⌥': 'Alt',
  '⌃': 'Ctrl',
  '⇧': 'Shift',
  '↵': '↵',
  '⇥': 'Tab',
};

function detectMac(): boolean {
  if (typeof navigator === 'undefined') return true; // SSR default — corrected after mount
  const ua = navigator.userAgent || '';
  const plat = navigator.platform || '';
  return /Mac|iPhone|iPad/.test(plat) || /Macintosh/.test(ua);
}

export function KeyHint({ keys, label }: { keys: string[]; label?: string }) {
  // Render mac glyphs on the first paint to match the values passed
  // by call-sites verbatim, then swap to platform-correct strings
  // after mount. Avoids hydration mismatches.
  const [isMac, setIsMac] = useState(true);
  useEffect(() => {
    setIsMac(detectMac());
  }, []);

  return (
    <span className="nc-keyhint">
      {keys.map((k, i) => (
        <kbd key={i}>{isMac ? k : (MAC_TO_PC[k] ?? k)}</kbd>
      ))}
      {label ? <span>{label}</span> : null}
    </span>
  );
}
