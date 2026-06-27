import { createClient } from '@/lib/supabase/server';
import type { Note } from '@/lib/notes/types';
import NotesView from '@/components/notes/NotesView';

export default async function NotesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('notes')
    .select('*')
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  return <NotesView initialNotes={(data as Note[]) ?? []} />;
}
