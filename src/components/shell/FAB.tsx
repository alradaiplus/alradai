'use client';

import { Icon } from '@/src/components/primitives/Icon';
import { useUI } from '@/src/store/uiStore';

export function FAB() {
  const open = useUI((s) => s.open);
  return (
    <button
      className="nc-fab"
      aria-label="Capture"
      title="Capture (⌘⇧Space)"
      onClick={() => open('capture')}
    >
      <Icon name="plus" size={18} />
    </button>
  );
}
