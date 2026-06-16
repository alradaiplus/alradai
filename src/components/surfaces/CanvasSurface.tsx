'use client';

import { useEffect } from 'react';

import { BlockRow } from '@/src/components/canvas/BlockRow';
import { useCanvas } from '@/src/store/canvasStore';
import { useUI } from '@/src/store/uiStore';

export function CanvasSurface() {
  const query = useCanvas((s) => s.query);
  const setQuery = useCanvas((s) => s.setQuery);
  const run = useCanvas((s) => s.run);
  const results = useCanvas((s) => s.results);
  const loading = useCanvas((s) => s.loading);
  const saved = useCanvas((s) => s.savedQueries);
  const openEditor = useUI((s) => s.openEditor);

  useEffect(() => {
    void run();
  }, [query, run]);

  return (
    <main className="nc-canvas">
      <aside className="nc-canvas__sidebar">
        <div>
          <div className="nc-canvas__group-label">Saved</div>
          {saved.map((s) => (
            <div
              key={s.id}
              className={`nc-canvas__link ${query === s.query ? 'nc-canvas__link--active' : ''}`}
              onClick={() => setQuery(s.query)}
            >
              {s.label}
            </div>
          ))}
        </div>
      </aside>
      <section className="nc-canvas__main">
        <div className="nc-canvas__query">
          <input
            value={query}
            placeholder="tag:mechatronics is:question  ·  or just text"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="nc-canvas__count">
          {loading ? 'searching…' : `${results.length} block${results.length === 1 ? '' : 's'}`}
        </div>
        {results.map((b) => (
          <BlockRow key={b.id} block={b} onOpen={() => openEditor(b.id)} />
        ))}
        {!loading && results.length === 0 ? (
          <div className="nc-empty">
            No blocks match this query. Try removing a filter — or capture one
            (⌘⇧Space).
          </div>
        ) : null}
      </section>
    </main>
  );
}
