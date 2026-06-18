# Notes Canvas — Your Visual Second Brain

> All your knowledge. One infinite canvas.

Notes Canvas is a visual second brain: an **infinite canvas** of free-positioned
note / image / file / embed nodes, connected into a **knowledge graph**, with
**AI that understands you** — answers grounded in your own notes, with citations
that link back to the canvas.

This repository is a faithful recreation (V1) of the product, built on a
production-grade foundation that scales to the V2 roadmap below.

![Notes Canvas](public/icon.svg)

## Features (V1)

- **Infinite canvas** (tldraw) — pan / zoom, grid, free node placement, marquee
  multi-select, resize handles, per-node context menu, z-order.
- **Five node types** — note (markdown), image, file, embed/3D, link — rendered
  as custom canvas shapes.
- **Knowledge graph** — curved connectors on the canvas, plus a dedicated
  force-directed **Graph view** derived from the same data. Click a graph node to
  jump to it on the canvas.
- **AI assistant** — streaming chat grounded in your notes (RAG) with clickable
  citations. Routed through **OpenRouter → Claude**, with multi-key rotation and
  model fallback. Works in a graceful local-fallback mode with no keys.
- **Inspector** — edit title / body / tags, see **backlinks** and accept/dismiss
  **AI-suggested links**.
- **Wikilinks** — Obsidian-style `[[Title]]`, `[[Title|alias]]`, `[[Title#heading]]`.
- **Command palette** (⌘K) — hybrid search (full-text + semantic) over notes plus
  quick actions.
- **Mobile** — fullscreen touch canvas, select/pan toggle, floating actions and a
  bottom sheet that hosts Details / AI.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Canvas | [tldraw](https://tldraw.dev) v3 with custom node shapes + connector overlay |
| Graph | react-force-graph-2d |
| State | Zustand (persisted) — the shared semantic store |
| Backend | Supabase (Postgres + pgvector, Auth, Storage, Realtime, Edge Functions) |
| AI | OpenRouter → Claude (streaming) · Supabase `gte-small` embeddings (384-dim) |
| Styling | Tailwind CSS |

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — app runs in demo mode without it
npm run dev                  # http://localhost:3000  (app at /app)
```

The app runs **fully in demo mode** with no backend: seeded content lives in a
persisted client store, and the AI panel returns grounded fallback answers. Add
the env below to enable the production backend and Claude-powered AI.

### Environment

See [`.env.example`](.env.example). Keys:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY_1` / `_2` / `_3` (rotated on rate-limit / quota errors)
- `OPENROUTER_MODEL_PRIMARY`, `OPENROUTER_MODEL_FALLBACK`

> ⚠️ **Never commit secrets.** `.env.local` is gitignored. If a key is ever
> exposed, rotate it at <https://openrouter.ai/keys>.

### Supabase backend

```bash
supabase start                      # local stack
supabase db push                    # apply migrations/0001_init.sql
supabase functions deploy embed     # gte-small embedding function
```

The schema (`supabase/migrations/0001_init.sql`) covers workspaces, boards,
nodes, edges, tags, files, embeddings and AI threads, with **Row Level Security**
on every table and an RRF **`hybrid_search`** function (FTS + pgvector).

## Architecture

- **Canvas owns geometry.** tldraw is the source of truth for the board
  (snapshot autosave in V1; Yjs CRDT in V2).
- **Semantic layer is projected.** Nodes / edges / tags / embeddings are derived
  from canvas shapes (one-way projection keyed by a stable `nodeId`) and power
  the graph view, search and AI. In demo mode the client store
  (`lib/store.ts`) stands in for this layer.
- **Connectors** render in page space via tldraw's `OnTheCanvas` component so
  they pan/zoom and follow nodes live (`components/canvas/Edges.tsx`).
- **RAG** retrieves relevant nodes, builds context, and streams a Claude answer
  with citations (`app/api/ai/chat/route.ts`, `lib/ai/*`).

```
app/            routes: / (landing), /app (canvas), /app/graph, /api/ai/chat
components/      canvas/ shell/ ai/ graph/ brand/ ui/
lib/            store, types, ai/, projection/, supabase/
supabase/       migrations/, functions/embed, config.toml
```

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm test           # vitest (projection + chunking)
```

## V2 roadmap (production hardening)

- **Multiplayer** — Yjs CRDT over a custom Supabase Realtime provider; live
  cursors; offline merge.
- **Scale** — viewport culling, worker-driven graph, virtualized lists, lazy
  signed-URL images for 1000s of nodes.
- **AI depth** — background auto-linking (pgvector kNN), auto-tagging,
  summarization, graph-aware retrieval.
- **Security & ops** — full RLS/pgTAP audit, rate limiting, Sentry, e2e
  (Playwright incl. realtime + mobile gestures).

---

Built as a faithful recreation of the Notes Canvas product.
