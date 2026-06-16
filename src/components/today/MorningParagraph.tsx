'use client';

import { useEffect, useState } from 'react';

import { db } from '@/src/core/db';
import type { Block } from '@/src/core/types';
import { useAgent } from '@/src/store/agentStore';

export function MorningParagraph() {
  const id = useAgent((s) => s.morningParagraphId);
  const [block, setBlock] = useState<Block | null>(null);

  useEffect(() => {
    if (!id) {
      setBlock(null);
      return;
    }
    void db.blocks.get(id).then((b) => setBlock(b ?? null));
  }, [id]);

  return (
    <section className="nc-card nc-morning">
      <div className="nc-card__head">
        <div>
          <div className="nc-card__title">Morning</div>
          <div className="nc-card__sub">
            {block ? 'Synthesis · last 24h' : 'Tomorrow morning'}
          </div>
        </div>
      </div>
      <div className="nc-card__body">
        {block ? (
          <p className="nc-morning__body">{block.body}</p>
        ) : (
          <p className="nc-morning__body nc-morning__body--muted">
            Your first synthesis will appear tomorrow morning. Capture a few
            thoughts during the day to give it something to read.
          </p>
        )}
      </div>
    </section>
  );
}
