export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type NoteColor =
  | 'default'
  | 'red'
  | 'orange'
  | 'amber'
  | 'green'
  | 'blue'
  | 'purple';
