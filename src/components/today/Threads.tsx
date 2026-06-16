'use client';

import { useAgent } from '@/src/store/agentStore';
import { useUI } from '@/src/store/uiStore';
import { parseThreadBody } from '@/src/core/threads';

/**
 * "This Week's Threads" card on Today. Renders only when threads exist
 * for the current week. Intentionally minimal — clicking a row opens
 * the agent-authored thread Block in the editor sheet, where backlinks
 * already show the contributing blocks.
 */
export function ThreadsCard() {
  const threads = useAgent((s) => s.threads);
  const openEditor = useUI((s) => s.openEditor);

  if (!threads || threads.length === 0) return null;

  return (
    <section className="nc-card" style={{ marginBottom: 22 }}>
      <div className="nc-card__head">
        <div>
          <div className="nc-card__title">This Week&apos;s Threads</div>
          <div className="nc-card__sub">
            {threads.length} emerging theme{threads.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>
      <div className="nc-card__body" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {threads.map((t) => {
          const { title, abstract } = parseThreadBody(t.body);
          return (
            <button
              key={t.id}
              type="button"
              className="nc-thread-row"
              onClick={() => openEditor(t.id)}
            >
              <div className="nc-thread-row__title">{title}</div>
              <div className="nc-thread-row__abs">{abstract}</div>
              <div className="nc-thread-row__meta">
                {t.links.length} block{t.links.length === 1 ? '' : 's'}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
