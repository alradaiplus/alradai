-- ============================================================================
-- Notes Canvas — platform schema (expansion)
-- Builds on 0001_init.sql. Adds the full product surface: projects, the
-- expanded node taxonomy (task/project/ai/pdf/voice/research), AI agents,
-- workspace memory, automations, smart templates, and an activity feed.
-- Everything stays workspace-scoped under the existing is_member() RLS model.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Expand the node taxonomy. (Every object is a node.)
-- New values are added if missing; they are not USED in this migration, so the
-- single-transaction restriction on enum values does not apply.
-- ---------------------------------------------------------------------------
alter type node_type add value if not exists 'task';
alter type node_type add value if not exists 'project';
alter type node_type add value if not exists 'ai';
alter type node_type add value if not exists 'pdf';
alter type node_type add value if not exists 'voice';
alter type node_type add value if not exists 'research';

-- ---------------------------------------------------------------------------
-- Projects. A project is also projected onto the canvas as a `project` node,
-- which is stored in `nodes`; this table holds the structured project record.
-- ---------------------------------------------------------------------------
create table if not exists projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  board_id     uuid references boards(id) on delete set null,
  node_id      uuid references nodes(id) on delete set null,  -- canvas representation
  name         text not null default 'Untitled project',
  description  text,
  status       text not null default 'active',                -- active | paused | done | archived
  color        text,
  icon         text,
  settings     jsonb not null default '{}',
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists projects_workspace_idx on projects(workspace_id);

-- Link nodes to a project (a node can belong to at most one project).
alter table nodes add column if not exists project_id uuid references projects(id) on delete set null;
create index if not exists nodes_project_idx on nodes(project_id);

-- Convenience view: tasks are nodes of type 'task'; task fields live in props.
create or replace view tasks as
  select
    n.id, n.workspace_id, n.board_id, n.project_id,
    n.title,
    coalesce((n.props->>'status'), 'todo')            as status,     -- todo | doing | done
    (n.props->>'priority')                            as priority,   -- low | med | high
    (n.props->>'due_at')::timestamptz                 as due_at,
    (n.props->>'assignee')::uuid                      as assignee,
    n.created_by, n.created_at, n.updated_at, n.deleted_at
  from nodes n
  where n.type = 'task' and n.deleted_at is null;

-- ---------------------------------------------------------------------------
-- AI agents: reusable, tool-using assistants. Runs stream into an `ai` node
-- and the activity feed; tools mutate the node graph.
-- ---------------------------------------------------------------------------
create table if not exists agents (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null,
  description   text,
  system_prompt text not null default '',
  model         text,                                     -- provider-agnostic id
  tools         jsonb not null default '[]',              -- enabled tool names
  config        jsonb not null default '{}',              -- temperature, budgets…
  is_enabled    boolean not null default true,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists agents_workspace_idx on agents(workspace_id);

create table if not exists agent_runs (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  agent_id      uuid references agents(id) on delete set null,
  board_id      uuid references boards(id) on delete set null,
  trigger       text not null default 'manual',           -- manual | automation | schedule
  status        text not null default 'queued',           -- queued | running | done | error
  input         jsonb not null default '{}',
  output        jsonb,
  steps         jsonb not null default '[]',              -- tool calls + results (audit)
  error         text,
  tokens        integer,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  finished_at   timestamptz
);
create index if not exists agent_runs_workspace_idx on agent_runs(workspace_id);
create index if not exists agent_runs_agent_idx on agent_runs(agent_id);

-- ---------------------------------------------------------------------------
-- Workspace memory: durable facts, preferences, and entities the AI should
-- remember. Embedded for semantic recall; fed into the Context Builder.
-- ---------------------------------------------------------------------------
create table if not exists memories (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  kind         text not null default 'fact',              -- fact | preference | entity | summary
  content      text not null,
  source_node  uuid references nodes(id) on delete set null,
  importance   real not null default 0.5,                 -- 0..1, decays/boosts over time
  embedding    vector(384),
  metadata     jsonb not null default '{}',
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists memories_workspace_idx on memories(workspace_id);
create index if not exists memories_hnsw
  on memories using hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Automations: trigger → conditions → actions. Actions are node-graph ops, so
-- automations stay native to the canvas model (no disconnected side effects).
-- ---------------------------------------------------------------------------
create table if not exists automations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  is_enabled   boolean not null default true,
  trigger      jsonb not null,                            -- {type, params}
  conditions   jsonb not null default '[]',               -- [{field, op, value}]
  actions      jsonb not null default '[]',               -- [{type, params}]
  last_run_at  timestamptz,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists automations_workspace_idx on automations(workspace_id);

create table if not exists automation_runs (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  automation_id uuid references automations(id) on delete cascade,
  status        text not null default 'done',             -- done | error | skipped
  context       jsonb not null default '{}',              -- triggering event
  result        jsonb,
  error         text,
  created_at    timestamptz not null default now()
);
create index if not exists automation_runs_workspace_idx on automation_runs(workspace_id);

-- ---------------------------------------------------------------------------
-- Smart templates: node/subgraph blueprints, optionally AI-fillable.
-- Instantiating a template materializes nodes + edges onto the canvas.
-- ---------------------------------------------------------------------------
create table if not exists templates (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  description  text,
  category     text,
  blueprint    jsonb not null,                            -- {nodes:[...], edges:[...], prompts:{}}
  is_ai_filled boolean not null default false,
  usage_count  integer not null default 0,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists templates_workspace_idx on templates(workspace_id);

-- ---------------------------------------------------------------------------
-- Activity feed: audit trail + realtime surface for agent/automation runs and
-- collaborator actions (drives the ActivityPanel).
-- ---------------------------------------------------------------------------
create table if not exists activity (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  board_id     uuid references boards(id) on delete set null,
  actor        uuid references auth.users(id),            -- null = system/agent
  verb         text not null,                             -- created | updated | linked | ran …
  object_type  text,                                      -- node | edge | agent_run | automation
  object_id    uuid,
  data         jsonb not null default '{}',
  created_at   timestamptz not null default now()
);
create index if not exists activity_workspace_idx on activity(workspace_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Semantic memory recall (mirror of hybrid_search, vector-only over memories).
-- ---------------------------------------------------------------------------
create or replace function recall_memories(
  p_workspace uuid,
  p_embedding vector(384),
  p_limit     int default 8
)
returns table (id uuid, content text, kind text, importance real, distance real)
language sql stable as $$
  select m.id, m.content, m.kind, m.importance,
         (m.embedding <=> p_embedding) as distance
  from memories m
  where m.workspace_id = p_workspace and p_embedding is not null
  order by (m.embedding <=> p_embedding) * (1.0 - 0.3 * m.importance) asc
  limit p_limit;
$$;

-- ---------------------------------------------------------------------------
-- updated_at maintenance for the new mutable tables
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['projects','agents','memories','automations','templates']
  loop
    execute format('drop trigger if exists %1$s_touch on %1$s;', t);
    execute format(
      'create trigger %1$s_touch before update on %1$s for each row execute function touch_updated_at();',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security — every new table is workspace-scoped via is_member().
-- ---------------------------------------------------------------------------
alter table projects        enable row level security;
alter table agents          enable row level security;
alter table agent_runs      enable row level security;
alter table memories        enable row level security;
alter table automations     enable row level security;
alter table automation_runs enable row level security;
alter table templates       enable row level security;
alter table activity        enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'projects','agents','agent_runs','memories',
    'automations','automation_runs','templates','activity'
  ]
  loop
    execute format(
      'create policy %1$s_member_all on %1$s for all using (is_member(workspace_id)) with check (is_member(workspace_id));',
      t
    );
  end loop;
end $$;
