'use client';

import { useUI } from '@/src/store/uiStore';

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="nc-toaster" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="nc-toast">
          {t.text}
        </div>
      ))}
    </div>
  );
}
