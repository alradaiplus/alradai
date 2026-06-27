'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { NOTE_COLOR_KEYS } from '@/lib/notes/colors';
import type { Note, NoteColor } from '@/lib/notes/types';

type Result<T> = { data: T | null; error: string | null };

function sanitizeColor(color: unknown): NoteColor {
  return NOTE_COLOR_KEYS.includes(color as NoteColor)
    ? (color as NoteColor)
    : 'default';
}

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, user };
}

export async function createNote(input: {
  title: string;
  content: string;
  color: NoteColor;
}): Promise<Result<Note>> {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: input.title.trim().slice(0, 200),
        content: input.content.slice(0, 20000),
        color: sanitizeColor(input.color),
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    revalidatePath('/[locale]/notes', 'page');
    return { data: data as Note, error: null };
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }
}

export async function updateNote(
  id: string,
  patch: Partial<Pick<Note, 'title' | 'content' | 'color' | 'pinned'>>
): Promise<Result<Note>> {
  try {
    const { supabase } = await requireUser();
    const next: Record<string, unknown> = {};
    if (patch.title !== undefined) next.title = patch.title.trim().slice(0, 200);
    if (patch.content !== undefined) next.content = patch.content.slice(0, 20000);
    if (patch.color !== undefined) next.color = sanitizeColor(patch.color);
    if (patch.pinned !== undefined) next.pinned = !!patch.pinned;

    const { data, error } = await supabase
      .from('notes')
      .update(next)
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    revalidatePath('/[locale]/notes', 'page');
    return { data: data as Note, error: null };
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }
}

export async function deleteNote(id: string): Promise<Result<{ id: string }>> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) return { data: null, error: error.message };
    revalidatePath('/[locale]/notes', 'page');
    return { data: { id }, error: null };
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }
}
