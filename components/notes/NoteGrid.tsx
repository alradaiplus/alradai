'use client';

import { useTranslations } from 'next-intl';

import type { Note } from '@/lib/notes/types';
import NoteCard from './NoteCard';

export default function NoteGrid({
  notes,
  query,
  onOpen,
  onTogglePin,
}: {
  notes: Note[];
  query: string;
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
}) {
  const t = useTranslations('notes');

  if (notes.length === 0) {
    return (
      <div className="card grid place-items-center px-6 py-16 text-center">
        <p className="text-ink-faint">{t('noResults', { query })}</p>
      </div>
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [&>*]:mb-4">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onOpen={() => onOpen(note)}
          onTogglePin={() => onTogglePin(note)}
        />
      ))}
    </div>
  );
}
