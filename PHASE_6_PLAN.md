# PHASE 6 — REMAINING NODE TYPES

## Scope
- Folder, Video, Code Snippet, Whiteboard, Mind Map, Bookmark, Calendar Event, Workflow, Embed
- Each: tailored card + inspector + AI context + database-property-compatible

## Files to Create/Modify

### New Files
- `src/core/nodes/folder.ts` — Folder node type
- `src/core/nodes/video.ts` — Video node with transcription
- `src/core/nodes/code.ts` — Code snippet with syntax highlighting
- `src/core/nodes/whiteboard.ts` — Whiteboard canvas
- `src/core/nodes/mindmap.ts` — Mind map structure
- `src/core/nodes/bookmark.ts` — Web bookmark with preview
- `src/core/nodes/calendar.ts` — Calendar event
- `src/core/nodes/workflow.ts` — Workflow/automation
- `src/components/nodes/FolderNode.tsx` — Folder renderer
- `src/components/nodes/VideoNode.tsx` — Video renderer
- `src/components/nodes/CodeNode.tsx` — Code renderer
- `src/components/nodes/BookmarkNode.tsx` — Bookmark renderer

### Modified Files
- `src/core/types.ts` — Add all node types
- `src/core/db.ts` — Add node-specific tables

## Implementation Order
1. Create folder node type
2. Implement video node with transcription
3. Add code snippet with syntax highlighting
4. Create bookmark with web preview
5. Implement calendar event
6. Add workflow/automation node
7. Create whiteboard canvas
8. Implement mind map
9. Add embed node

## Risks
- Video transcription cost and latency
- Whiteboard performance with large drawings
- Bookmark preview freshness

## Tradeoff
Video transcription will use Supabase Edge Functions with Whisper API. This adds latency but reduces client-side complexity.
