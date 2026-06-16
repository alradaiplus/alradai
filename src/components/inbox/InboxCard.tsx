'use client';

import { Button } from '@/src/components/primitives/Button';
import { TagChip } from '@/src/components/primitives/TagChip';
import type { Block } from '@/src/core/types';
import { ago } from '@/src/core/time';

type Props = {
  block: Block;
  focused: boolean;
  suggestedTags: string[];
  onFile: (tags: string[]) => void;
  onArchive: () => void;
};

export function InboxCard({ block, focused, suggestedTags, onFile, onArchive }: Props) {
  return (
    <article className={`nc-inbox__card ${focused ? 'nc-inbox__card--focused' : ''}`}>
      <div className="nc-inbox__body" />
      <div className="nc-inbox__card-body">{block.body}</div>
      <div className="nc-inbox__meta">
        {ago(block.createdAt)} · captured via {block.source}
      </div>
      {suggestedTags.length > 0 ? (
        <div className="nc-inbox__suggest">
          {suggestedTags.map((t) => (
            <TagChip key={t} tag={t} />
          ))}
        </div>
      ) : null}
      <div className="nc-inbox__actions">
        <Button variant="primary" onClick={() => onFile(suggestedTags)}>
          File · F
        </Button>
        <Button onClick={onArchive}>Archive · E</Button>
      </div>
    </article>
  );
}
