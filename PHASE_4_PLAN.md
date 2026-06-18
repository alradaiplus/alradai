# PHASE 4 — MIRO PILLAR COMPLETENESS

## Scope
- Drag nodes and edit edge labels on canvas
- Nesting, grouping, layers, minimap
- Frames and templates
- Virtualization for 5k+ nodes at 60fps
- Manual board creation and editing

## Files to Create/Modify

### New Files
- `src/components/canvas/DraggableNode.tsx` — Draggable board node
- `src/components/canvas/EdgeEditor.tsx` — Edge label editing
- `src/components/canvas/Minimap.tsx` — Canvas minimap
- `src/components/canvas/LayerPanel.tsx` — Layer management
- `src/components/canvas/FrameEditor.tsx` — Frame creation/editing
- `src/components/canvas/VirtualCanvas.tsx` — Virtualized renderer
- `src/store/canvasStore.ts` — Canvas state with drag/drop

### Modified Files
- `src/components/surfaces/BoardSurface.tsx` — Add drag, layers, minimap
- `src/core/boards/types.ts` — Add nesting, frames, layers

## Canvas Schema Extensions

### New Fields on BoardNode
- parentId (text) — for nesting
- layerId (text) — for layer management
- frameId (text) — for frame grouping

### New Tables
1. **board_frames**
   - id (text, PK)
   - board_id (text, FK)
   - name (text)
   - x, y, width, height (float)
   - color (text)
   - created_at (timestamp)

2. **board_layers**
   - id (text, PK)
   - board_id (text, FK)
   - name (text)
   - visible (boolean)
   - locked (boolean)
   - order (int)
   - created_at (timestamp)

3. **board_templates**
   - id (text, PK)
   - workspace_id (UUID, FK)
   - name (text)
   - nodes (jsonb)
   - edges (jsonb)
   - clusters (jsonb)
   - created_at (timestamp)

## Implementation Order
1. Add drag-and-drop to nodes
2. Implement edge label editing
3. Add layer management UI
4. Create minimap component
5. Implement frame grouping
6. Add virtualization for large canvases
7. Build template system
8. Add manual board creation

## Risks
- Drag performance with >1k nodes
- Virtualization complexity (viewport culling)
- Nesting depth limits (prevent infinite loops)

## Tradeoff
Virtualization will use viewport-based culling instead of quadtree. This is simpler but may have lower performance at extreme scales (>10k nodes). Recommend quadtree for v2.
