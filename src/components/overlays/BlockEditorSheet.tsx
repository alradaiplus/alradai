'use client';

import { useEffect, useState } from 'react';

import { Sheet } from '@/src/components/primitives/Sheet';
import { ContradictionSheet } from '@/src/components/overlays/ContradictionSheet';
import { contradictionsForBlock } from '@/src/ai/features/contradiction';
import { getBlock, updateBlockBody, db } from '@/src/core/db';
import { ago, longDate } from '@/src/core/time';
import { useUI } from '@/src/store/uiStore';
import type { Block } from '@/src/core/types';

export function BlockEditorSheet() {
  const close = useUI((s) => s.close);
  const id = useUI((s) => s.editorBlockId);
  const [block, setBlock] = useState<Block | null>(null);
  const [body, setBody] = useState('');
  const [backlinks, setBacklinks] = useState<Block[]>([]);
  const [contradictionCount, setContradictionCount] = useState(0);
  const [showContradictions, setShowContradictions] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!id) return;
    (async () => {
      const b = await getBlock(id);
      if (!alive || !b) return;
      setBlock(b);
      setBody(b.body);
      const [back, contradictions] = await Promise.all([
        db.blocks.where('links').equals(id).filter((x) => !x.archivedAt).toArray(),
        contradictionsForBlock(id),
      ]);
      if (!alive) return;
      setBacklinks(back);
      setContradictionCount(contradictions.length);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  async function save() {
    if (!block || body === block.body) return;
    const updated = await updateBlockBody(block.id, body);
    if (updated) setBlock(updated);
  }

  if (!block) return null;

  return (
    <>
      <Sheet title="Block" onClose={() => void save().then(close)}>
        {contradictionCount > 0 ? (
          <ContradictionPill
            count={contradictionCount}
            onClick={() => setShowContradictions(true)}
          />
        ) : null}

        <div className="nc-editor-sheet__meta">
          Created {longDate(block.createdAt)} · {ago(block.createdAt)}
          {block.tags.length ? ' · ' + block.tags.map((t) => '#' + t).join(' ') : ''}
        </div>
        <textarea
          className="nc-editor-sheet__textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={save}
          spellCheck
        />
        <div className="nc-sheet__section" style={{ marginTop: 22 }}>
          <div className="nc-sheet__section-label">Backlinks ({backlinks.length})</div>
          {backlinks.length === 0 ? (
            <div className="nc-empty" style={{ padding: '12px 0' }}>
              No blocks link here yet.
            </div>
          ) : (
            backlinks.map((b) => (
              <div
                key={b.id}
                className="nc-canvas__link"
                style={{ borderRadius: 8 }}
                onClick={() => useUI.getState().openEditor(b.id)}
              >
                · {b.body.slice(0, 80)}
              </div>
            ))
          )}
        </div>
      </Sheet>

      {showContradictions ? (
        <ContradictionSheet
          blockId={block.id}
          onClose={() => setShowContradictions(false)}
        />
      ) : null}
    </>
  );
}

function ContradictionPill({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="nc-contra-pill"
      aria-label="View contradictions"
    >
      <span className="nc-contra-pill__dot" />
      <span>Contradicts your previous position</span>
      {count > 1 ? (
        <span className="nc-contra-pill__count">+{count - 1}</span>
      ) : null}
    </button>
  );
}
