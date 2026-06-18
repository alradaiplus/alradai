# PHASE 7 — COLLABORATION

## Scope
- CRDT realtime editing with Yjs
- Presence cursors and awareness
- Comments and @mentions
- Permissions and role-based access
- Share links with expiration
- Audit log

## Files to Create/Modify

### New Files
- `src/core/collab/yjs-provider.ts` — Yjs Supabase provider
- `src/core/collab/presence.ts` — Presence and awareness
- `src/core/collab/comments.ts` — Comments and mentions
- `src/core/collab/permissions.ts` — Role-based access control
- `src/core/collab/audit.ts` — Audit logging
- `src/components/collab/PresenceCursor.tsx` — Remote cursor
- `src/components/collab/CommentThread.tsx` — Comment UI
- `src/components/collab/ShareDialog.tsx` — Share link generation

### Modified Files
- `src/core/db.ts` — Add collaboration tables
- `src/core/sync.ts` — Integrate Yjs
- All editor components — Add Yjs binding

## Database Schema Extensions

### New Tables
1. **workspace_members**
   - id (UUID, PK)
   - workspace_id (UUID, FK)
   - user_id (UUID, FK)
   - role (enum: owner, editor, viewer, commenter)
   - joined_at (timestamp)

2. **comments**
   - id (text, PK)
   - block_id (text, FK)
   - user_id (UUID, FK)
   - content (text)
   - mentions (text[])
   - resolved (boolean)
   - created_at (timestamp)
   - updated_at (timestamp)

3. **share_links**
   - id (text, PK)
   - workspace_id (UUID, FK)
   - token (text, unique)
   - role (enum: viewer, commenter, editor)
   - expires_at (timestamp)
   - created_by (UUID, FK)
   - created_at (timestamp)

4. **audit_log**
   - id (UUID, PK)
   - workspace_id (UUID, FK)
   - user_id (UUID, FK)
   - action (text)
   - resource_type (text)
   - resource_id (text)
   - changes (jsonb)
   - created_at (timestamp)

## Implementation Order
1. Set up Yjs with Supabase provider
2. Implement presence and awareness
3. Add comments and mentions
4. Create role-based permissions
5. Implement share links
6. Add audit logging
7. Build UI for collaboration features
8. Test multi-user scenarios

## Risks
- Yjs sync conflicts at scale
- Presence update overhead
- Comment notification spam

## Tradeoff
Yjs will use Supabase Realtime for sync instead of a dedicated WebSocket server. This reduces infrastructure cost but may have higher latency.
