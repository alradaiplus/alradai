'use client';

import { type MouseEventHandler } from 'react';

type Props = {
  tag: string;
  accent?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function TagChip({ tag, accent, onClick }: Props) {
  return (
    <button
      type="button"
      className={`nc-tag ${accent ? 'nc-tag--accent' : ''}`}
      onClick={onClick}
    >
      {tag.startsWith('#') ? tag : `#${tag}`}
    </button>
  );
}
