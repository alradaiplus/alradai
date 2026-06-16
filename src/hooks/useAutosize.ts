'use client';

import { useLayoutEffect } from 'react';

export function useAutosize(
  ref: React.RefObject<HTMLTextAreaElement>,
  value: string,
  maxPx = 480,
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, maxPx) + 'px';
  }, [ref, value, maxPx]);
}
