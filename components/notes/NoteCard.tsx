'use client';

import { useTranslations } from 'next-intl';
import { Pin } from 'lucide-react';

import type { Note } from '@/lib/notes/types';
import { noteColor } from '@/lib/notes/colors';

export default function NoteCard({
  note,
  onOpen,
  onTogglePin,
}: {
  note: Note;
  onOpen: () => void;
  onTogglePin: () => void;
}) {
  const t = useTranslations('notes');
  const c = noteColor(note.color);
  const hasTitle = note.title.trim().length > 0;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{ backgroundColor: c.bg, borderColor: c.border }}
      className="card-interactive group relative block w-full break-inside-avoid rounded-2xl border p-4 text-start"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin();
        }}
        aria-label={note.pinned ? t('unpin') : t('pin')}
        className={`absolute top-3 grid h-8 w-8 place-items-center rounded-full transition ltr:right-3 rtl:left-3 ${
          note.pinned
            ? 'text-brand-500'
            : 'text-ink-faint opacity-0 hover:text-brand-500 group-hover:opacity-100 focus:opacity-100'
        }`}
      >
        <Pin size={16} fill={note.pinned ? 'currentColor' : 'none'} />
      </button>

      {hasTitle ? (
        <h3 className="mb-1 line-clamp-2 pe-7 font-semibold text-ink">
          {note.title}
        </h3>
      ) : null}
      {note.content ? (
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-soft line-clamp-[12]">
          {note.content}
        </p>
      ) : (
        !hasTitle && <p className="text-sm italic text-ink-faint">{t('emptyNote')}</p>
      )}
    </article>
  );
}
