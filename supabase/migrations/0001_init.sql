-- ============================================================================
-- Notes Canvas — initial schema
-- Postgres + pgvector. Bridges tldraw canvas geometry with a semantic
-- knowledge graph (nodes/edges/tags) plus embeddings for RAG and hybrid search.
-- Row Level Security is enforced on every table via workspace membership.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Identity & workspaces
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table if not exists workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  settings   jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create type member_role as enum ('owner', 'editor', 'viewer');

create table if not exists memberships (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         member_role not null default 'editor',
  created_at   timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Boards (canvases)
-- ---------------------------------------------------------------------------
create table if not exists boards (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  title           text not null default 'Untitled board',
  icon            text,
  version         integer not null default 0,        -- optimistic concurrency (V1 snapshot autosave)
  tldraw_snapshot jsonb,                              -- V1 source of truth (geometry)
  yjs_state       bytea,                              -- V2 source of truth (CRDT)
  is_archived     boolean not null default false,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists boards_workspace_idx on boards(workspace_id);

-- ---------------------------------------------------------------------------
-- Semantic layer: nodes / edges / tags  (projected from canvas geometry)
-- ---------------------------------------------------------------------------
create type node_type as enum ('note', 'image', 'file', 'embed', 'link');

create table if not exists files (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  board_id       uuid references boards(id) on delete set null,
  storage_path   text not null,
  bucket         text not null default 'files',
  mime           text,
  size_bytes     bigint,
  width          integer,
  height         integer,
  thumbnail_path text,
  checksum       text,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now()
);

create table if not exists nodes (
  id           uuid primary key default gen_random_uuid(),  -- == tldraw shape props.nodeId
  workspace_id uuid not null references workspaces(id) on delete cascade,
  board_id     uuid not null references boards(id) on delete cascade,
  shape_id     text,                                        -- tldraw record id
  type         node_type not null default 'note',
  title        text not null default 'Untitled',
  content_md   text not null default '',
  content_text text not null default '',                    -- plain text for FTS
  props        jsonb not null default '{}',                 -- {x,y,w,h,rotation,index,color}
  file_id      uuid references files(id) on delete set null,
  search_tsv   tsvector,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create index if not exists nodes_workspace_idx on nodes(workspace_id);
create index if not exists nodes_board_idx on nodes(board_id);
create index if not exists nodes_tsv_idx on nodes using gin(search_tsv);

create type edge_kind   as enum ('arrow', 'wikilink', 'ai_suggested', 'reference');
create type edge_status as enum ('active', 'suggested', 'dismissed');

create table if not exists edges (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  board_id       uuid references boards(id) on delete cascade,
  source_node_id uuid not null references nodes(id) on delete cascade,
  target_node_id uuid references nodes(id) on delete cascade,
  arrow_shape_id text,
  kind           edge_kind not null default 'arrow',
  status         edge_status not null default 'active',
  label          text,
  target_title   text,            -- for unresolved (ghost) wikilinks
  directed       boolean not null default true,
  confidence     real,            -- 0..1 for ai_suggested
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  unique (source_node_id, target_node_id, kind)
);
create index if not exists edges_workspace_idx on edges(workspace_id);
create index if not exists edges_target_idx on edges(target_node_id);

create table if not exists tags (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         citext not null,
  color        text,
  created_at   timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists node_tags (
  node_id uuid not null references nodes(id) on delete cascade,
  tag_id  uuid not null references tags(id) on delete cascade,
  source  text not null default 'manual',            -- manual | ai
  primary key (node_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Embeddings (gte-small, 384-dim) for RAG + semantic search
-- ---------------------------------------------------------------------------
create table if not exists node_embeddings (
  id            uuid primary key default gen_random_uuid(),
  node_id       uuid not null references nodes(id) on delete cascade,
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  chunk_index   integer not null default 0,
  content_chunk text not null,
  embedding     vector(384),
  token_count   integer,
  created_at    timestamptz not null default now(),
  unique (node_id, chunk_index)
);
create index if not exists node_embeddings_hnsw
  on node_embeddings using hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- AI threads / messages
-- ---------------------------------------------------------------------------
create table if not exists ai_threads (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  board_id      uuid references boards(id) on delete set null,
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text,
  context_scope text not null default 'board',       -- board | workspace | selection
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists ai_messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references ai_threads(id) on delete cascade,
  role       text not null,                          -- user | assistant | system
  content    text not null,
  model      text,
  tokens     integer,
  citations  jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Triggers: maintain search_tsv + updated_at
-- ---------------------------------------------------------------------------
create or replace function nodes_tsv_trigger() returns trigger as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.content_text, '')), 'B');
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists nodes_tsv on nodes;
create trigger nodes_tsv before insert or update on nodes
  for each row execute function nodes_tsv_trigger();

-- ---------------------------------------------------------------------------
-- Hybrid search: full-text + vector, fused via Reciprocal Rank Fusion
-- ---------------------------------------------------------------------------
create or replace function hybrid_search(
  p_workspace uuid,
  p_query     text,
  p_embedding vector(384),
  p_limit     int default 20,
  p_rrf_k     int default 50
)
returns table (node_id uuid, title text, score real)
language sql stable as $$
  with fts as (
    select n.id,
           row_number() over (order by ts_rank(n.search_tsv, websearch_to_tsquery('english', p_query)) desc) as rank
    from nodes n
    where n.workspace_id = p_workspace
      and n.deleted_at is null
      and n.search_tsv @@ websearch_to_tsquery('english', p_query)
    limit 50
  ),
  vec as (
    select e.node_id as id,
           row_number() over (order by e.embedding <=> p_embedding) as rank
    from node_embeddings e
    where e.workspace_id = p_workspace and p_embedding is not null
    order by e.embedding <=> p_embedding
    limit 50
  ),
  fused as (
    select coalesce(fts.id, vec.id) as id,
           coalesce(1.0 / (p_rrf_k + fts.rank), 0) +
           coalesce(1.0 / (p_rrf_k + vec.rank), 0) as score
    from fts full outer join vec on fts.id = vec.id
  )
  select n.id, n.title, f.score::real
  from fused f
  join nodes n on n.id = f.id
  order by f.score desc
  limit p_limit;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles        enable row level security;
alter table workspaces      enable row level security;
alter table memberships     enable row level security;
alter table boards          enable row level security;
alter table nodes           enable row level security;
alter table edges           enable row level security;
alter table tags            enable row level security;
alter table node_tags       enable row level security;
alter table files           enable row level security;
alter table node_embeddings enable row level security;
alter table ai_threads      enable row level security;
alter table ai_messages     enable row level security;

-- Helper: is the current user a member of a workspace?
create or replace function is_member(p_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.workspace_id = p_workspace and m.user_id = auth.uid()
  );
$$;

create policy profiles_self on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy workspaces_member on workspaces
  for select using (is_member(id) or owner_id = auth.uid());
create policy workspaces_owner_write on workspaces
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy memberships_member on memberships
  for select using (is_member(workspace_id));

-- Generic workspace-scoped policies for the content tables.
do $$
declare t text;
begin
  foreach t in array array['boards','nodes','edges','tags','files','node_embeddings','ai_threads']
  loop
    execute format(
      'create policy %1$s_member_all on %1$s for all using (is_member(workspace_id)) with check (is_member(workspace_id));',
      t
    );
  end loop;
end $$;

create policy node_tags_member on node_tags
  for all using (
    exists (select 1 from nodes n where n.id = node_tags.node_id and is_member(n.workspace_id))
  ) with check (
    exists (select 1 from nodes n where n.id = node_tags.node_id and is_member(n.workspace_id))
  );

create policy ai_messages_member on ai_messages
  for all using (
    exists (select 1 from ai_threads th where th.id = ai_messages.thread_id and is_member(th.workspace_id))
  ) with check (
    exists (select 1 from ai_threads th where th.id = ai_messages.thread_id and is_member(th.workspace_id))
  );
