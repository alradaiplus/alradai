'use client';

import { useEffect, useState } from 'react';

import { Sheet } from '@/src/components/primitives/Sheet';
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

  useEffect(() => {
    let alive = true;
    if (!id) return;
    (async () => {
      const b = await getBlock(id);
      if (!alive || !b) return;
      setBlock(b);
      setBody(b.body);
      const back = await db.blocks
        .where('links')
        .equals(id)
        .filter((x) => !x.archivedAt)
        .toArray();
      if (alive) setBacklinks(back);
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
    <Sheet title="Block" onClose={() => void save().then(close)}>
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
  );
}
