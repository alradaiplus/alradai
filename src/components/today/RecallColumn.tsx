'use client';

import { useAgent } from '@/src/store/agentStore';
import { useUI } from '@/src/store/uiStore';
import { ago } from '@/src/core/time';
import { firstLine } from '@/src/core/text';

export function RecallColumn() {
  const recall = useAgent((s) => s.recall);
  const openEditor = useUI((s) => s.openEditor);

  return (
    <aside>
      <div className="nc-card" style={{ position: 'sticky', top: 80 }}>
        <div className="nc-card__head">
          <div>
            <div className="nc-card__title">Recall</div>
            <div className="nc-card__sub">Older notes you might want</div>
          </div>
        </div>
        <div className="nc-card__body nc-recall">
          {recall.length === 0 ? (
            <div className="nc-empty" style={{ padding: 12 }}>
              Write a thought to see related notes.
            </div>
          ) : (
            recall.map((b) => (
              <button
                key={b.id}
                className="nc-recall__card"
                onClick={() => openEditor(b.id)}
              >
                <div className="nc-recall__title">{firstLine(b.body, 80)}</div>
                <div className="nc-recall__meta">
                  {ago(b.createdAt)} · {b.links.length} link
                  {b.links.length === 1 ? '' : 's'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
