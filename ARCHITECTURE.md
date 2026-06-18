# Notes Canvas — Production Architecture

> An infinite-canvas knowledge workspace where **every object is a node**, the
> **canvas is the primary interface**, and **AI understands the entire
> workspace**. Built to stay fast at thousands of nodes, keyboard-first on
> desktop, capture-first on mobile.

This document is the single source of truth for the system design. It covers the
complete application: folder structure, database schema, APIs, auth, the canvas
and node systems, AI, search, storage, realtime, and mobile. It also specifies
the expansion features (agents, memory, automations, etc.) and how each one maps
back into the canvas/node model so nothing becomes a disconnected silo.

---

## 1. Product principles (non-negotiable)

1. The canvas is the primary interface.
2. Every object is a node.
3. Everything created anywhere is representable on the canvas.
4. AI understands the entire workspace context.
5. Fast even with thousands of nodes.
6. Keyboard-first workflows are first-class.
7. Mobile is optimized for capture, review, search, voice, and AI — not a shrunk desktop.
8. Every feature integrates into the canvas model.
9. No feature bloat, no disconnected experiences.
10. Cohesive, premium, intentional.

These principles are enforced architecturally, not just aspirationally:

- **"Every object is a node"** is enforced by a single `nodes` table with a
  discriminated `type` and a typed `data` JSONB payload (Section 4). Tasks,
  projects, PDFs, voice notes, AI threads, and research are all rows in `nodes`.
- **"AI understands the whole workspace"** is enforced by the embeddings +
  hybrid-search layer (Section 8) and the Workspace Context Builder (Section 7),
  which every AI feature consumes through one interface.
- **"Fast at thousands of nodes"** is enforced by viewport-windowed rendering,
  spatial indexing, and server-side pagination by bounding box (Section 5).

---

## 2. Tech stack

| Layer        | Choice                                                              |
| ------------ | ------------------------------------------------------------------ |
| Framework    | Next.js (App Router) + TypeScript (strict)                          |
| Styling      | Tailwind CSS + design tokens (CSS variables) + shadcn/ui            |
| Motion       | Framer Motion (panels, sheets, command palette, node enter/exit)   |
| Canvas       | tldraw (custom shape utils + bindings) as the infinite-canvas core  |
| Graph view   | Force-directed (canvas 2D) projection of the same node/edge data    |
| Backend      | Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)    |
| Vector       | pgvector (HNSW) with hybrid lexical + semantic search (RRF)         |
| AI gateway   | Provider-agnostic: OpenAI **and** Anthropic compatible, key rotation|
| Embeddings   | Supabase Edge Function (gte-small / OpenAI text-embedding-3-small)  |
| State        | Zustand (client canvas/session) + TanStack Query (server cache)     |
| Realtime     | Supabase Realtime (Postgres CDC + broadcast + presence)            |
| Deploy       | Vercel (app + API routes) / GitHub Pages (static demo build)        |

**Provider-agnostic AI** is a hard requirement: the gateway exposes one
`generate()` / `stream()` / `embed()` interface and routes to OpenAI or Anthropic
(or OpenRouter) based on config and availability. No feature imports a provider
SDK directly.

---

## 3. Folder structure

```
notes-canvas/
├── app/                                  # Next.js App Router
│   ├── (marketing)/                      # Public landing, pricing, auth
│   │   ├── page.tsx
│   │   ├── pricing/page.tsx
│   │   └── (auth)/{login,signup,callback}/page.tsx
│   ├── (app)/                            # Authenticated product shell
│   │   ├── layout.tsx                    # Shell: rails, panels, providers
│   │   ├── canvas/[boardId]/page.tsx     # The primary interface
│   │   ├── graph/page.tsx                # Knowledge graph view
│   │   ├── dashboard/[projectId]/page.tsx# Project dashboards
│   │   ├── search/page.tsx               # Full semantic search surface
│   │   └── settings/**                   # Workspace, members, billing, AI keys
│   ├── api/                              # Route handlers (server)
│   │   ├── ai/
│   │   │   ├── chat/route.ts             # Workspace AI (RAG, streaming)
│   │   │   ├── agents/[agentId]/run/route.ts
│   │   │   ├── summarize/route.ts
│   │   │   ├── suggest/route.ts          # AI suggestions (links, tasks)
│   │   │   ├── analyze/route.ts          # Canvas-wide analysis
│   │   │   └── research/route.ts         # AI research assistant
│   │   ├── search/route.ts               # Hybrid search endpoint
│   │   ├── nodes/route.ts                # Batched node CRUD (bbox queries)
│   │   ├── upload/route.ts               # Signed upload URLs (Storage)
│   │   ├── transcribe/route.ts           # Voice → text
│   │   └── automations/[id]/trigger/route.ts
│   ├── globals.css                       # Design tokens (CSS variables)
│   └── layout.tsx
│
├── components/
│   ├── canvas/                           # tldraw integration & node shapes
│   │   ├── Canvas.tsx                    # <Tldraw> wrapper + store sync
│   │   ├── shapes/                       # One ShapeUtil per node type
│   │   │   ├── NoteShapeUtil.tsx
│   │   │   ├── TaskShapeUtil.tsx
│   │   │   ├── ProjectShapeUtil.tsx
│   │   │   ├── AiShapeUtil.tsx
│   │   │   ├── PdfShapeUtil.tsx
│   │   │   ├── ImageShapeUtil.tsx
│   │   │   ├── VoiceShapeUtil.tsx
│   │   │   └── ResearchShapeUtil.tsx
│   │   ├── bindings/ConnectionBinding.ts # Typed edges between nodes
│   │   ├── CanvasToolbar.tsx             # Create / select / pan / zoom
│   │   └── QuickCreate.tsx               # Double-click / drop to create
│   ├── nodes/                            # Headless node card renderers (shared
│   │   └── *Card.tsx                     #   by canvas, search, dashboards, mobile)
│   ├── panels/                           # Floating panels
│   │   ├── Inspector.tsx                 # Selected-node details + backlinks
│   │   ├── AssistantPanel.tsx            # Workspace AI
│   │   ├── ActivityPanel.tsx             # Agent/automation runs
│   │   └── MemoryPanel.tsx               # Workspace memory browser
│   ├── shell/                            # Sidebar, top bar, mobile chrome
│   │   ├── Sidebar.tsx
│   │   ├── MobileShell.tsx               # Capture-first mobile UI
│   │   └── CommandPalette.tsx            # ⌘K — actions, nav, AI
│   ├── automation/AutomationBuilder.tsx  # Trigger→condition→action graph
│   └── ui/                               # shadcn/ui primitives (themed)
│
├── lib/
│   ├── nodes/                            # The node system (framework-agnostic)
│   │   ├── registry.ts                   # Node type registry (single source)
│   │   ├── schema.ts                     # Zod schemas per node `data` payload
│   │   └── types.ts
│   ├── canvas/
│   │   ├── store.ts                      # Zustand canvas store
│   │   ├── sync.ts                       # tldraw ⇄ Supabase reconciliation
│   │   ├── spatial.ts                    # Viewport windowing / bbox math
│   │   └── projection.ts                 # nodes/edges → graph layout
│   ├── ai/
│   │   ├── gateway.ts                    # Provider-agnostic (OpenAI/Anthropic)
│   │   ├── context.ts                    # Workspace Context Builder (RAG)
│   │   ├── agents/                       # Agent runtime + tool definitions
│   │   │   ├── runtime.ts
│   │   │   └── tools.ts                  # Tools operate on the node graph
│   │   ├── memory.ts                     # Workspace memory read/write
│   │   ├── prompts/                      # Versioned prompt templates
│   │   └── stream.ts                     # SSE helpers
│   ├── search/
│   │   ├── hybrid.ts                     # RRF fusion of lexical + vector
│   │   └── embeddings.ts                 # Embedding client (Edge Function)
│   ├── supabase/
│   │   ├── client.ts                     # Browser client
│   │   ├── server.ts                     # Server client (RSC/route handlers)
│   │   └── realtime.ts                   # Channel subscriptions + presence
│   ├── storage/files.ts                  # Signed URLs, processing pipeline
│   ├── automations/engine.ts             # Trigger/condition/action evaluator
│   └── utils.ts
│
├── supabase/
│   ├── migrations/                       # SQL migrations (ordered)
│   │   ├── 0001_init.sql                 # V1 demo schema
│   │   └── 0002_platform.sql             # Full platform schema (this doc)
│   ├── functions/                        # Edge Functions (Deno)
│   │   ├── embed/                        # Generate embeddings
│   │   ├── process-file/                 # PDF text extraction, thumbnails
│   │   └── transcribe/                   # Voice → text
│   └── config.toml
│
├── hooks/                                # React hooks (useNodes, useAI, …)
├── ARCHITECTURE.md                       # This document
└── ...
```

**Why headless node cards (`components/nodes/*Card.tsx`)?** A `Task` must render
identically as a tldraw shape, a search result, a dashboard row, and a mobile
list item. Each node type ships one presentational card consumed by all four
surfaces, which is how we keep "everything is representable on the canvas"
true without four divergent implementations.

---

## 4. Database schema

Full SQL lives in `supabase/migrations/0002_platform.sql`. Design rules:

- **One `nodes` table** for every object type (discriminated by `type`, typed
  `data` JSONB). Cross-cutting columns (position, size, board, project, author,
  timestamps, soft-delete) are first-class; type-specific fields live in `data`
  validated by Zod (`lib/nodes/schema.ts`) on write.
- **`edges`** are typed, directed connections (`relation` enum) — the substrate
  for both visible connectors and the knowledge graph.
- **RLS everywhere**, scoped through `workspace_members`. No table is readable
  without a membership row.
- **pgvector** in `node_embeddings`, chunked, with an HNSW index and a
  `hybrid_search` SQL function (lexical `tsvector` + vector, fused with RRF).

Core entities:

```
workspaces ─┬─ workspace_members (role: owner/admin/editor/viewer)
            ├─ boards            (infinite canvases)
            ├─ projects          (a project is also projected as a node)
            ├─ nodes ────────────┬─ node_embeddings (pgvector, chunked)
            │                     ├─ tasks (view over nodes WHERE type='task')
            │                     └─ files (Storage objects ↔ pdf/image/voice nodes)
            ├─ edges             (typed relationships between nodes)
            ├─ agents            (definitions) ─ agent_runs (executions)
            ├─ memories          (workspace memory: facts/preferences/entities)
            ├─ automations       (trigger/condition/action) ─ automation_runs
            ├─ templates         (smart templates: node/subgraph blueprints)
            └─ activity          (audit + realtime activity feed)
```

`nodes` (abridged):

| column        | type        | notes                                            |
| ------------- | ----------- | ------------------------------------------------ |
| id            | uuid pk     |                                                  |
| workspace_id  | uuid fk     | RLS scope                                         |
| board_id      | uuid fk     | which canvas                                      |
| project_id    | uuid fk?    | optional project membership                       |
| type          | node_type   | note/task/project/ai/pdf/image/voice/research    |
| title         | text        |                                                  |
| content       | text        | primary text (for FTS + embeddings)              |
| data          | jsonb       | type-specific, Zod-validated                      |
| x, y, w, h    | double      | canvas geometry                                   |
| z             | int         | stacking                                          |
| color/icon    | text?       | per-node overrides                                |
| tags          | text[]      |                                                  |
| created_by    | uuid fk     |                                                  |
| created_at/updated_at | tstz |                                                  |
| deleted_at    | tstz?       | soft delete                                       |
| search_tsv    | tsvector    | generated; GIN index                              |

Indexes: `(workspace_id, board_id)`, `(workspace_id, project_id)`, GIN on
`search_tsv` and `tags`, and a bbox-friendly btree on `(board_id, x, y)` for
viewport queries.

---

## 5. Canvas system

- **tldraw** is the rendering/interaction engine. Each node type is a custom
  `ShapeUtil` (`components/canvas/shapes/*`); connections are tldraw **bindings**
  so edges follow nodes during drag.
- **Source of truth is Postgres.** `lib/canvas/sync.ts` reconciles tldraw store
  changes → Supabase (debounced, optimistic) and applies inbound Realtime
  changes back into the tldraw store with last-writer-wins + per-field merge for
  text. (V2 upgrades text to Yjs CRDT for conflict-free multiplayer editing.)
- **Performance at thousands of nodes:**
  - Server returns nodes by **bounding box** for the current viewport plus a
    margin (`/api/nodes?bbox=`), not the whole board.
  - `lib/canvas/spatial.ts` keeps an in-memory spatial index (grid/R-tree) for
    hit-testing and windowed rendering; off-screen shapes are culled.
  - Embeddings/AI never run on the client render path; they're async + cached.
  - Edges render on a single overlay layer in page space (one paint, not N).
- **Creation paths** (all produce nodes): toolbar, double-click QuickCreate,
  drag-drop files, paste, ⌘K, voice capture, AI output, automations, templates.

---

## 6. Node system

`lib/nodes/registry.ts` is the **single source of truth** for node types. Each
entry declares: `type`, label, icon, category color, default size, the Zod
schema for its `data`, the headless card component, the tldraw ShapeUtil, and its
AI affordances (how it contributes to context, what tools can act on it). Adding
a node type = adding one registry entry; every surface (canvas, search,
dashboard, mobile, AI context) picks it up automatically.

Node types: `note`, `task`, `project`, `ai`, `pdf`, `image`, `voice`,
`research`. Connections are `edges`, not a node type, but are first-class in the
graph and inspector.

---

## 7. AI architecture

**Gateway (`lib/ai/gateway.ts`)** — provider-agnostic. Normalizes OpenAI and
Anthropic chat/stream/embeddings behind one interface, with multi-key rotation,
per-key cooldown on 429/5xx, and model fallback. Features call the gateway, never
a vendor SDK.

**Workspace Context Builder (`lib/ai/context.ts`)** — the heart of "AI
understands the entire workspace." Given a query + current focus (selection,
board, project), it assembles context via hybrid search over `node_embeddings`,
expands along `edges` (neighbors of cited nodes), pulls relevant `memories`, and
returns a token-budgeted, cited context block. Every AI feature consumes this.

**Features, all canvas-native:**

| Feature                  | How it maps to the canvas/node model                                   |
| ------------------------ | ---------------------------------------------------------------------- |
| Workspace AI             | Chat panel + `ai` nodes; answers cite nodes and deep-link to them.     |
| AI Agents                | `agents` definitions; runs stream into an `ai` node + ActivityPanel; tools mutate the node graph (create/link/tag). |
| Workspace Memory         | `memories` table; surfaced in MemoryPanel; auto-fed into context.      |
| Voice-to-Canvas          | Record → `transcribe` → creates a `voice` node + AI-extracted tasks/notes linked to it. |
| AI Research Assistant    | `research` node that fans out sub-questions, gathers sources as child nodes, synthesizes a summary node. |
| Smart Task Generation    | AI reads a note/project subgraph → proposes `task` nodes (accept to materialize, pre-linked). |
| Auto-Linking             | On node create/update, embed → nearest-neighbor → suggest `edges`; one click to confirm. |
| AI Summaries             | Per-node, per-project, per-board summary written back as node `data.summary` or a summary node. |
| AI Suggestions           | Inline, context-aware (links, tasks, tags, next actions) in the Inspector. |
| Canvas-wide AI Analysis  | `analyze` over a board/selection: clusters, gaps, duplicates, themes → annotations + suggested edges. |
| Relationship Discovery   | Embedding similarity + co-occurrence → proposes non-obvious `edges` in the graph. |
| Smart Templates          | `templates` = node/subgraph blueprints, AI-fillable, instantiated onto the canvas. |
| Command Palette          | ⌘K runs any action, navigation, or AI command; keyboard-first. |
| Automation Builder       | `automations` trigger→condition→action graph; actions are node-graph operations. |

**Agent runtime (`lib/ai/agents/runtime.ts`)** — a tool-using loop. Tools
(`tools.ts`) are graph operations: `search_workspace`, `create_node`,
`link_nodes`, `summarize`, `create_tasks`, `update_node`. Every mutation is
attributed, reversible, and streamed to the ActivityPanel so the user sees what
the agent did on the canvas.

---

## 8. Search architecture

- **Embeddings** generated by the `embed` Edge Function on node create/update
  (chunked, stored in `node_embeddings` with HNSW index).
- **Hybrid search** (`hybrid_search` SQL fn): lexical `tsvector` ranking +
  vector cosine distance, fused with **Reciprocal Rank Fusion**. Returns nodes
  with scores and matched chunks.
- **Surfaces:** the ⌘K palette (fast top-k), the dedicated `/search` page
  (filters by type/project/tag/date), and the AI Context Builder (RAG).

---

## 9. Storage architecture

- **Supabase Storage** buckets: `files` (pdf/image/voice originals),
  `thumbnails`, `exports`. Private buckets; access via short-lived **signed
  URLs** minted server-side (`/api/upload`, `lib/storage/files.ts`).
- **Upload flow:** client requests a signed upload URL → uploads directly to
  Storage → a `files` row + a `pdf`/`image`/`voice` node are created → the
  `process-file` Edge Function extracts text (PDF), generates thumbnails, and
  enqueues embeddings.
- RLS on `storage.objects` mirrors workspace membership.

---

## 10. Realtime architecture

- **Supabase Realtime** on `nodes`, `edges`, `activity` (Postgres CDC) →
  collaborators see creates/moves/edits live.
- **Presence** per board (who's here, cursors). **Broadcast** for ephemeral
  signals (drag previews, typing) that shouldn't hit the DB.
- Client merges inbound changes into the tldraw store via `lib/canvas/sync.ts`
  (last-writer-wins now; Yjs CRDT for text in V2).
- Agent/automation runs publish progress over a per-run channel into the
  ActivityPanel.

---

## 11. Authentication & authorization

- **Supabase Auth** (email magic link + OAuth). Server clients in RSC/route
  handlers via `@supabase/ssr` cookies.
- **Workspaces** are the tenancy boundary. `workspace_members.role` ∈
  {owner, admin, editor, viewer}. **RLS** on every table joins through
  `workspace_members` so a user only ever sees their workspaces' data.
- AI provider keys are **per-workspace**, encrypted at rest, never shipped to the
  client; all AI calls are server-side.

---

## 12. Mobile architecture

Mobile is a **distinct, capture-first experience**, not a shrunk desktop:

- **Capture:** a prominent FAB and share-target for instant note / photo /
  voice capture → becomes a node, queued to a board.
- **Voice:** one-tap record → transcribe → voice node + extracted tasks.
- **Review:** a focused feed/stack of recent and AI-surfaced nodes (swipe to
  triage, link, or archive).
- **Search & AI:** full hybrid search and the AI assistant are front-and-center.
- **Canvas:** a read/light-edit pan-zoom view (move, connect, comment) — heavy
  authoring stays on desktop. Bottom sheets (Framer Motion) replace side panels;
  44px+ touch targets; safe-area aware; `dvh` units.

---

## 13. Accessibility & polish

- WCAG AA contrast (the monochrome tokens are tuned for it; accent fills use
  `--accent-foreground`).
- Full keyboard operability (roving tabindex on rails, focus traps in
  dialogs/sheets, visible focus rings, ⌘K for everything).
- Respects `prefers-reduced-motion`. Live regions for AI streaming and toasts.
- Design quality bar: Linear / Arc / Figma / Obsidian / Raycast — restrained
  motion, consistent spacing scale, dense-but-legible typography.

---

## 14. Design system

Tokens are CSS variables in `app/globals.css`, surfaced to Tailwind in
`tailwind.config.ts` (single source of truth). Monochrome by design:

```
--bg-primary:#050505  --bg-secondary:#0D0D0D  --bg-surface:#141414  --bg-elevated:#1B1B1B
--text-primary:#FFFFFF --text-secondary:#CFCFCF --text-muted:#8A8A8A
--border-subtle:#262626 --border-strong:#3A3A3A
--accent:#F5F5F5 --accent-hover:#FFFFFF --accent-foreground:#050505
--success:#EAEAEA --warning:#D0D0D0 --danger:#A0A0A0
```

Node category hues are the *only* color in the system — restrained, desaturated
tints used solely so node types and graph relationships stay distinguishable.

---

## 15. Scalability, correctness, maintainability

- **Scalability:** viewport-windowed queries, HNSW vector index, async AI/embeds,
  edge functions for CPU-heavy work, Realtime broadcast for ephemeral signals.
- **Correctness:** TypeScript strict, Zod validation at every write boundary, RLS
  as the security backstop, unit tests on pure logic (search fusion, chunking,
  projection, automation evaluation), integration tests on API routes.
- **Maintainability:** the node registry and headless cards prevent divergence;
  the AI gateway and Context Builder are the only ways features touch models and
  workspace knowledge; one migrations directory; CI runs typecheck/lint/test/build.

---

## 16. Roadmap beyond this cut

Multiplayer text via Yjs CRDT; offline-first with local persistence + sync;
fine-grained sharing (node/board level); usage metering + billing; pgTAP RLS
test suite; Playwright E2E; Sentry + OpenTelemetry; agent marketplace.
