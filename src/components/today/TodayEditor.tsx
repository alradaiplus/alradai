'use client';

import { useEffect, useRef } from 'react';

import { useAutosize } from '@/src/hooks/useAutosize';
import { useDebounced } from '@/src/hooks/useDebounced';
import { useAgent } from '@/src/store/agentStore';
import { useToday } from '@/src/store/todayStore';

export function TodayEditor() {
  const draft = useToday((s) => s.draft);
  const setDraft = useToday((s) => s.setDraft);
  const flush = useToday((s) => s.flushDraft);
  const endBlock = useToday((s) => s.endBlock);
  const refreshRecall = useAgent((s) => s.refreshRecall);
  const ref = useRef<HTMLTextAreaElement>(null);

  useAutosize(ref, draft);

  // Autosave 600ms after typing stops
  const debounced = useDebounced(draft, 600);
  useEffect(() => {
    if (debounced.trim().length === 0) return;
    void flush();
  }, [debounced, flush]);

  // Recall recomputes 400ms after caret stops
  const recallSeed = useDebounced(draft, 400);
  useEffect(() => {
    if (recallSeed.trim().length < 8) return;
    void refreshRecall(recallSeed);
  }, [recallSeed, refreshRecall]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const isCmd = e.metaKey || e.ctrlKey;
    if (isCmd && e.key === 'Enter') {
      e.preventDefault();
      void endBlock();
    }
  }

  return (
    <section className="nc-card">
      <div className="nc-card__head">
        <div>
          <div className="nc-card__title">Today&apos;s Writing</div>
          <div className="nc-card__sub">⌘↵ to finalize a block</div>
        </div>
      </div>
      <div className="nc-editor">
        <textarea
          ref={ref}
          value={draft}
          placeholder="Write a thought… use #tags and [[links]]."
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck
        />
        <div className="nc-editor__hint">
          Autosaves · ⌘↵ to end block · ⌘L to link
        </div>
      </div>
    </section>
  );
}
