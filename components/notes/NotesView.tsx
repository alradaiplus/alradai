'use client';

import { useMemo, useState } from 'react';

import type { Note, NoteColor } from '@/lib/notes/types';
import { createNote, updateNote, deleteNote } from '@/app/_actions/notes';
import NoteToolbar from './NoteToolbar';
import NoteGrid from './NoteGrid';
import NoteEditor from './NoteEditor';
import EmptyState from './EmptyState';

function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updated_at.localeCompare(a.updated_at);
  });
}

export type EditorTarget = Note | 'new' | null;

export default function NotesView({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(() => sortNotes(initialNotes));
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<EditorTarget>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
  }, [notes, query]);

  async function handleSave(input: {
    title: string;
    content: string;
    color: NoteColor;
  }) {
    if (editing === 'new') {
      const { data } = await createNote(input);
      if (data) setNotes((prev) => sortNotes([data, ...prev]));
    } else if (editing) {
      const { data } = await updateNote(editing.id, input);
      if (data) {
        setNotes((prev) =>
          sortNotes(prev.map((n) => (n.id === data.id ? data : n)))
        );
      }
    }
    setEditing(null);
  }

  async function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setEditing(null);
    await deleteNote(id);
  }

  async function handleTogglePin(note: Note) {
    const nextPinned = !note.pinned;
    setNotes((prev) =>
      sortNotes(
        prev.map((n) => (n.id === note.id ? { ...n, pinned: nextPinned } : n))
      )
    );
    await updateNote(note.id, { pinned: nextPinned });
  }

  return (
    <div className="space-y-6">
      <NoteToolbar
        query={query}
        onQueryChange={setQuery}
        onNew={() => setEditing('new')}
      />

      {notes.length === 0 ? (
        <EmptyState onNew={() => setEditing('new')} />
      ) : (
        <NoteGrid
          notes={filtered}
          query={query}
          onOpen={(note) => setEditing(note)}
          onTogglePin={handleTogglePin}
        />
      )}

      {editing !== null ? (
        <NoteEditor
          note={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={editing === 'new' ? undefined : () => handleDelete(editing.id)}
        />
      ) : null}
    </div>
  );
}
