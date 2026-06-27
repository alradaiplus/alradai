-- ============================================================================
-- Notes app schema
-- Run this in the Supabase SQL Editor (or via the Supabase CLI) for your
-- project. It creates the `notes` table, enables Row-Level Security, and adds
-- policies so each user can only read/write their own notes.
-- ============================================================================

create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null default '',
  content    text not null default '',
  color      text not null default 'default',
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fast lookups of a user's notes, newest first.
create index if not exists notes_user_id_updated_at_idx
  on public.notes (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Keep updated_at fresh on every update.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security: a user only ever sees / mutates their own rows.
-- ---------------------------------------------------------------------------
alter table public.notes enable row level security;

drop policy if exists "Notes are viewable by owner" on public.notes;
create policy "Notes are viewable by owner"
  on public.notes for select
  using (auth.uid() = user_id);

drop policy if exists "Notes are insertable by owner" on public.notes;
create policy "Notes are insertable by owner"
  on public.notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Notes are updatable by owner" on public.notes;
create policy "Notes are updatable by owner"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Notes are deletable by owner" on public.notes;
create policy "Notes are deletable by owner"
  on public.notes for delete
  using (auth.uid() = user_id);
