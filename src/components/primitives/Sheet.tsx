'use client';

import { type ReactNode, useEffect } from 'react';

import { IconButton } from './IconButton';

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Sheet({ title, onClose, children }: Props) {
  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="nc-overlay-root nc-overlay-root--sheet" onMouseDown={onClose}>
      <aside className="nc-sheet" onMouseDown={(e) => e.stopPropagation()}>
        <header className="nc-sheet__head">
          <div className="nc-sheet__title">{title}</div>
          <IconButton icon="close" aria-label="Close" onClick={onClose} />
        </header>
        <div className="nc-sheet__body">{children}</div>
      </aside>
    </div>
  );
}
