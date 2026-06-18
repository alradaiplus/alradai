# PHASE 3 — OBSIDIAN PILLAR

## Scope
- [[Wikilinks]] parser with title-based resolution and autocomplete
- Backlinks panel with cross-surface references (canvas + db)
- Unlinked mentions discovery
- Daily notes with calendar navigation
- Transclusion (live node embedding)
- Tag pages with dedicated surface
- Upgrade graph: local graph per node, filters, depth controls

## Files to Create/Modify

### New Files
- `src/core/graph/parser.ts` — Wikilink parser and resolver
- `src/core/graph/backlinks.ts` — Backlinks computation across surfaces
- `src/core/graph/mentions.ts` — Unlinked mentions discovery
- `src/core/graph/transclusion.ts` — Live node embedding
- `src/components/graph/ForceDirectedGraph.tsx` — Graph visualization
- `src/components/graph/LocalGraph.tsx` — Per-node local graph
- `src/components/graph/TagPage.tsx` — Tag-based surface
- `src/components/today/DailyNotes.tsx` — Calendar-based daily notes
- `src/store/graphStore.ts` — Graph state management

### Modified Files
- `src/core/text.ts` — Enhance wikilink extraction with titles
- `src/components/overlays/BlockEditorSheet.tsx` — Add backlinks + transclusion
- `src/components/surfaces/CanvasSurface.tsx` — Add graph tab

## Graph Schema Extensions

### New Tables
1. **graph_nodes**
   - id (text, PK)
   - workspace_id (UUID, FK)
   - block_id (text, FK)
   - title (text)
   - created_at (timestamp)

2. **graph_edges**
   - id (text, PK)
   - workspace_id (UUID, FK)
   - from_block_id (text, FK)
   - to_block_id (text, FK)
   - type (enum: wikilink, backlink, mention, relation)
   - created_at (timestamp)

3. **daily_notes**
   - id (text, PK)
   - workspace_id (UUID, FK)
   - date (text) — 'YYYY-MM-DD'
   - block_id (text, FK)
   - created_at (timestamp)

## Implementation Order
1. Enhance wikilink parser with title resolution
2. Build backlinks computation across all surfaces
3. Implement unlinked mentions discovery
4. Create force-directed graph visualization
5. Add local graph per node
6. Implement transclusion (live embedding)
7. Create tag pages surface
8. Add calendar-based daily notes
9. Wire graph to canvas and editor

## Risks
- Graph rendering performance at scale (>5k nodes)
- Wikilink resolution ambiguity (multiple nodes with same title)
- Transclusion infinite loops (A embeds B, B embeds A)

## Tradeoff
Wikilink resolution will prioritize exact title match, then fuzzy match. Ambiguous links will show a disambiguation menu. This adds UX complexity but ensures correctness.
