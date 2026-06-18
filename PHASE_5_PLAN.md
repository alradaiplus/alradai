# PHASE 5 — CHATGPT PILLAR

## Scope
- Threaded AI conversation node type with persistent history
- Workspace RAG over hybrid search (full-text + pgvector + rerank)
- Multi-step agent runtime with visible workflow execution
- Per-node AI actions menu (summarize, extend, critique, link, generate children)
- Semantic relationship discovery (replaces keyword overlap)
- Citations back to source nodes, clickable

## Files to Create/Modify

### New Files
- `src/core/ai/chat-node.ts` — Chat node type and operations
- `src/core/ai/rag.ts` — Hybrid RAG implementation
- `src/core/ai/agent.ts` — Multi-step agent runtime
- `src/core/ai/actions.ts` — Per-node AI actions
- `src/components/ai/ChatThread.tsx` — Chat node renderer
- `src/components/ai/AIActionMenu.tsx` — AI actions context menu
- `src/components/ai/AgentWorkflow.tsx` — Agent runtime visualization
- `src/store/aiStore.ts` — AI state management

### Modified Files
- `src/core/types.ts` — Add ChatNode type
- `src/core/db.ts` — Add chat_messages table
- `src/ai/gateway.ts` — Add RAG context to prompts

## Database Schema Extensions

### New Tables
1. **chat_nodes**
   - id (text, PK)
   - workspace_id (UUID, FK)
   - block_id (text, FK)
   - title (text)
   - created_at (timestamp)
   - updated_at (timestamp)

2. **chat_messages**
   - id (text, PK)
   - chat_node_id (text, FK)
   - role (enum: user, assistant, system)
   - content (text)
   - tokens (int)
   - cost_usd (float)
   - citations (jsonb) — array of {blockId, title}
   - created_at (timestamp)

3. **embeddings** (pgvector)
   - id (UUID, PK)
   - block_id (text, FK)
   - workspace_id (UUID, FK)
   - embedding (vector(1536))
   - created_at (timestamp)

4. **agent_workflows**
   - id (text, PK)
   - workspace_id (UUID, FK)
   - status (enum: pending, running, completed, failed)
   - plan (jsonb)
   - steps (jsonb)
   - result (text)
   - created_at (timestamp)

## Implementation Order
1. Create chat node type and message storage
2. Implement hybrid RAG (full-text + pgvector + rerank)
3. Build per-node AI actions menu
4. Implement multi-step agent runtime
5. Create agent workflow visualization
6. Add citation rendering and linking
7. Implement semantic relationship discovery
8. Wire RAG to all AI features

## Risks
- RAG quality with mixed embedding models
- Agent hallucination (citations to non-existent blocks)
- Token cost explosion with large workspaces

## Tradeoff
RAG will use a simple reranker (cosine similarity) instead of a learned model. This reduces cost but may have lower quality. Recommend BM25 + pgvector hybrid search for production.
