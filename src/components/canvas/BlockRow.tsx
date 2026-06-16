'use client';

import type { Block } from '@/src/core/types';
import { ago } from '@/src/core/time';
import { excerpt } from '@/src/core/text';

export function BlockRow({ block, onOpen }: { block: Block; onOpen: () => void }) {
  return (
    <article className="nc-block-row" onClick={onOpen}>
      <div className="nc-block-row__meta">
        <span>{ago(block.createdAt)}</span>
        {block.tags.slice(0, 4).map((t) => (
          <span key={t}>#{t}</span>
        ))}
        {block.links.length > 0 ? <span>· {block.links.length} link</span> : null}
      </div>
      <div className="nc-block-row__body">{excerpt(block.body, 280)}</div>
    </article>
  );
}
