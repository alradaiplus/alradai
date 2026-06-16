'use client';

import { IconButton } from '@/src/components/primitives/IconButton';
import { useUI } from '@/src/store/uiStore';
import { Icon } from '@/src/components/primitives/Icon';
import { useInbox } from '@/src/store/inboxStore';

const TABS: { id: 'today' | 'canvas' | 'inbox'; label: string; icon: 'today' | 'canvas' | 'inbox' }[] = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'canvas', label: 'Canvas', icon: 'canvas' },
  { id: 'inbox', label: 'Inbox', icon: 'inbox' },
];

export function Header() {
  const surface = useUI((s) => s.surface);
  const setSurface = useUI((s) => s.setSurface);
  const open = useUI((s) => s.open);
  const inboxCount = useInbox((s) => s.blocks.length);

  return (
    <header className="nc-header">
      <div className="nc-header__brand">
        <div className="nc-header__mark">N</div>
        <span>Notes Canvas</span>
        <span className="nc-header__crumb">
          / {TABS.find((t) => t.id === surface)?.label}
        </span>
      </div>

      <nav style={{ display: 'flex', gap: 4 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className="nc-btn nc-btn--ghost"
            onClick={() => setSurface(t.id)}
            style={{
              color: surface === t.id ? 'var(--text)' : 'var(--text-mute)',
            }}
          >
            <Icon name={t.icon} size={13} />
            <span>{t.label}</span>
            {t.id === 'inbox' && inboxCount > 0 ? (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  color: 'var(--bg)',
                  background: 'var(--text)',
                  borderRadius: 999,
                  padding: '1px 6px',
                }}
              >
                {inboxCount}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="nc-header__actions">
        <IconButton icon="search" aria-label="Command bar" onClick={() => open('command')} />
        <IconButton icon="settings" aria-label="Settings" onClick={() => open('settings')} />
      </div>
    </header>
  );
}
