'use client';

import { useEffect, useMemo } from 'react';

import { InboxCard } from '@/src/components/inbox/InboxCard';
import { useHotkey } from '@/src/hooks/useHotkey';
import { useInbox } from '@/src/store/inboxStore';
import { useUI } from '@/src/store/uiStore';
import { extractTags, tokenize } from '@/src/core/text';

export function InboxSurface() {
  const ready = useInbox((s) => s.ready);
  const hydrate = useInbox((s) => s.hydrate);
  const blocks = useInbox((s) => s.blocks);
  const focusIdx = useInbox((s) => s.focusIdx);
  const file = useInbox((s) => s.file);
  const archive = useInbox((s) => s.archive);
  const focusNext = useInbox((s) => s.focusNext);
  const focusPrev = useInbox((s) => s.focusPrev);
  const toast = useUI((s) => s.toast);

  useEffect(() => {
    if (!ready) void hydrate();
  }, [ready, hydrate]);

  const focused = blocks[focusIdx];

  useHotkey('j', () => focusNext());
  useHotkey('k', () => focusPrev());
  useHotkey('f', () => {
    if (!focused) return;
    const tags = suggestTags(focused.body);
    void file(focused.id, tags).then(() => toast('Filed'));
  });
  useHotkey('e', () => {
    if (!focused) return;
    void archive(focused.id).then(() => toast('Archived'));
  });

  if (blocks.length === 0) {
    return (
      <main className="nc-inbox">
        <header className="nc-inbox__head">
          <div className="nc-inbox__title">Inbox</div>
          <div className="nc-inbox__count">zero</div>
        </header>
        <p style={{ color: 'var(--text-mute)', fontSize: 14 }}>
          Inbox zero. Captures will land here for triage.
        </p>
      </main>
    );
  }

  return (
    <main className="nc-inbox">
      <header className="nc-inbox__head">
        <div className="nc-inbox__title">Inbox</div>
        <div className="nc-inbox__count">
          {blocks.length} to process · J / K to move · F file · E archive
        </div>
      </header>
      {blocks.map((b, i) => (
        <InboxCard
          key={b.id}
          block={b}
          focused={i === focusIdx}
          suggestedTags={suggestTags(b.body)}
          onFile={(tags) =>
            file(b.id, tags).then(() => toast('Filed'))
          }
          onArchive={() => archive(b.id).then(() => toast('Archived'))}
        />
      ))}
    </main>
  );
}

function suggestTags(body: string): string[] {
  const explicit = extractTags(body);
  if (explicit.length > 0) return explicit.slice(0, 4);
  // simple heuristic: top-2 most distinctive tokens as candidate topics
  const toks = tokenize(body);
  return toks.slice(0, 2);
}
