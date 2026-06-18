# PHASE 1 — BACKEND FOUNDATION

## Scope
- Supabase: schema, RLS, auth (email + OAuth), storage, realtime
- Provider-agnostic AI gateway (OpenAI + Anthropic), streaming, token accounting
- Migration: localStorage → Supabase with offline cache + optimistic updates
- Embeddings pipeline + pgvector + hybrid search wired to ⌘K

## Files to Create/Modify

### New Files
- `src/core/supabase.ts` — Supabase client init, RLS helpers
- `src/core/migrations.ts` — IndexedDB → Supabase migration logic
- `src/core/sync.ts` — Offline cache + optimistic updates + realtime subscription
- `src/ai/gateway.ts` — Provider abstraction (OpenAI + Anthropic)
- `src/ai/embeddings-pgvector.ts` — pgvector integration for hybrid search
- `src/hooks/useSync.ts` — Realtime sync hook
- `middleware.ts` — Auth middleware for protected routes
- `.env.local.example` — Environment variables template

### Modified Files
- `package.json` — Add Supabase, OpenAI, Anthropic clients
- `src/core/db.ts` — Add Supabase schema queries
- `src/core/types.ts` — Add User, Workspace, Tenant types
- `src/store/authStore.ts` — New auth store (Zustand)
- `src/components/overlays/SettingsSheet.tsx` — Add OAuth login UI

## Supabase Schema

### Tables
1. **users** (auth.users extended)
   - id (UUID, PK)
   - email (text, unique)
   - full_name (text)
   - avatar_url (text)
   - created_at (timestamp)

2. **workspaces**
   - id (UUID, PK)
   - owner_id (UUID, FK → users)
   - name (text)
   - created_at (timestamp)
   - updated_at (timestamp)

3. **workspace_members**
   - id (UUID, PK)
   - workspace_id (UUID, FK)
   - user_id (UUID, FK)
   - role (enum: owner, editor, viewer)
   - created_at (timestamp)

4. **blocks**
   - id (text, PK)
   - workspace_id (UUID, FK)
   - body (text)
   - created_at (timestamp)
   - updated_at (timestamp)
   - source (enum: manual, capture, voice, share, agent)
   - tags (text[])
   - links (text[])
   - attachments (jsonb)
   - tokens (text[])
   - agent_summary (text)
   - archived_at (timestamp)
   - inbox (int)
   - pinned_today (int)

5. **blocks_embeddings**
   - id (UUID, PK)
   - block_id (text, FK)
   - workspace_id (UUID, FK)
   - embedding (vector(1536)) — pgvector
   - created_at (timestamp)

6. **boards**
   - id (text, PK)
   - workspace_id (UUID, FK)
   - title (text)
   - topic (text)
   - created_at (timestamp)
   - origin (enum: agent, manual)
   - prompt (text)
   - expires_at (timestamp)
   - clusters (jsonb)

7. **board_nodes**
   - id (text, PK)
   - board_id (text, FK)
   - block_id (text, FK)
   - x (float)
   - y (float)
   - cluster (text)

8. **board_edges**
   - id (text, PK)
   - board_id (text, FK)
   - from_block_id (text, FK)
   - to_block_id (text, FK)
   - label (enum: supports, contradicts, derives, asks)

9. **commitments**
   - id (text, PK)
   - workspace_id (UUID, FK)
   - date (text)
   - slot (int)
   - text (text)
   - done (int)
   - updated_at (timestamp)

10. **agent_runs**
    - id (text, PK)
    - workspace_id (UUID, FK)
    - kind (enum: recall, synthesis, contradiction, thread, board, embed)
    - ran_at (timestamp)
    - provider (text)
    - model (text)
    - prompt_tokens (int)
    - output_tokens (int)
    - cost_usd (float)
    - result_block_id (text)
    - ok (int)
    - err (text)

11. **attachments**
    - id (UUID, PK)
    - workspace_id (UUID, FK)
    - block_id (text, FK)
    - kind (enum: image, pdf, audio, video, url)
    - url (text)
    - meta (jsonb)
    - created_at (timestamp)

### RLS Policies
- All tables: Users can only access data in their workspace(s)
- blocks: SELECT/INSERT/UPDATE/DELETE if user is workspace member
- blocks_embeddings: SELECT if user is workspace member
- boards, board_nodes, board_edges: Same as blocks
- agent_runs: SELECT/INSERT if user is workspace member

## Implementation Order
1. Set up Supabase project + schema
2. Create auth store + login UI
3. Implement offline cache + sync layer
4. Migrate existing IndexedDB data to Supabase
5. Wire pgvector embeddings to search
6. Add streaming AI providers (OpenAI + Anthropic)
7. Update all queries to use Supabase client

## Risks
- Data loss during migration if not tested thoroughly
- Realtime subscription overhead at scale (>1k concurrent users)
- pgvector embedding dimension mismatch (1536 vs 32)

## Tradeoff
Migrating from 32-d lexical embeddings to 1536-d pgvector embeddings will improve semantic search quality but increase storage/compute cost. Recommend using pgvector for production RAG, keeping lexical fallback for offline mode.
