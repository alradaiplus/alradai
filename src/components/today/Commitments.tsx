'use client';

import { useEffect, useMemo, useState } from 'react';

import { Icon } from '@/src/components/primitives/Icon';
import { KeyHint } from '@/src/components/primitives/KeyHint';
import { useHotkey } from '@/src/hooks/useHotkey';
import { useToday } from '@/src/store/todayStore';
import type { Commitment } from '@/src/core/types';

const SLOTS: Array<1 | 2 | 3> = [1, 2, 3];

export function Commitments() {
  const commitments = useToday((s) => s.commitments);
  const toggle = useToday((s) => s.toggle);
  const setCommit = useToday((s) => s.setCommitment);

  const bySlot = useMemo(() => {
    const out = new Map<1 | 2 | 3, Commitment>();
    for (const c of commitments) out.set(c.slot, c);
    return out;
  }, [commitments]);

  useHotkey('cmd+1', () => toggle(1));
  useHotkey('cmd+2', () => toggle(2));
  useHotkey('cmd+3', () => toggle(3));

  return (
    <section className="nc-card nc-commitments">
      <div className="nc-card__head">
        <div>
          <div className="nc-card__title">Commitments</div>
          <div className="nc-card__sub">Three things, today.</div>
        </div>
        <KeyHint keys={['⌘', '1–3']} label="toggle" />
      </div>
      <div className="nc-card__body" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {SLOTS.map((slot) => (
          <Row
            key={slot}
            slot={slot}
            commit={bySlot.get(slot)}
            onToggle={() => toggle(slot)}
            onSave={(text) => setCommit(slot, text)}
          />
        ))}
      </div>
    </section>
  );
}

function Row({
  slot,
  commit,
  onToggle,
  onSave,
}: {
  slot: 1 | 2 | 3;
  commit: Commitment | undefined;
  onToggle: () => void;
  onSave: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(commit?.text ?? '');

  useEffect(() => {
    setDraft(commit?.text ?? '');
  }, [commit?.text]);

  function commit_() {
    const text = draft.trim();
    if (text) onSave(text);
    setEditing(false);
  }

  const done = commit?.done === 1;

  return (
    <div className="nc-commit-row">
      <button
        className={`nc-check ${done ? 'nc-check--on' : ''}`}
        aria-label={done ? 'Mark not done' : 'Mark done'}
        onClick={onToggle}
      >
        {done ? <Icon name="check" size={11} /> : null}
      </button>
      {editing || !commit ? (
        <input
          autoFocus={editing}
          className="nc-commit-row__input"
          value={draft}
          placeholder={`Commitment ${slot}`}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit_}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit_();
            }
          }}
        />
      ) : (
        <div
          className="nc-commit-row__input"
          style={{
            cursor: 'text',
            color: done ? 'var(--text-mute)' : 'var(--text)',
            textDecoration: done ? 'line-through' : 'none',
          }}
          onClick={() => setEditing(true)}
        >
          {commit.text}
        </div>
      )}
      <span className="nc-commit-row__hint">⌘{slot}</span>
    </div>
  );
}
