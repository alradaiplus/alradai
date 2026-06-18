# PHASE 2 — NOTION PILLAR

## Scope
- Block-based editor with slash menu and all core block types
- Database node type with schema, properties, formulas/rollups (basic)
- Views: table, board, calendar, gallery, timeline
- Every database row becomes a canvas node and graph node

## Files to Create/Modify

### New Files
- `src/core/database.ts` — Database schema and CRUD operations
- `src/core/blocks/editor.ts` — Block editor state machine
- `src/components/editor/BlockEditor.tsx` — Rich block editor with slash menu
- `src/components/editor/SlashMenu.tsx` — Command palette for block types
- `src/components/database/DatabaseView.tsx` — Database node renderer
- `src/components/database/TableView.tsx` — Table view implementation
- `src/components/database/BoardView.tsx` — Kanban board view
- `src/components/database/CalendarView.tsx` — Calendar view
- `src/components/database/GalleryView.tsx` — Gallery view
- `src/components/database/TimelineView.tsx` — Timeline view
- `src/store/databaseStore.ts` — Database state management

### Modified Files
- `src/core/types.ts` — Add Database, Property, View types
- `src/core/db.ts` — Add database tables and queries
- `src/components/overlays/BlockEditorSheet.tsx` — Integrate rich editor

## Database Schema Extensions

### New Tables
1. **databases**
   - id (text, PK)
   - workspace_id (UUID, FK)
   - name (text)
   - description (text)
   - created_at (timestamp)
   - updated_at (timestamp)

2. **database_properties**
   - id (text, PK)
   - database_id (text, FK)
   - name (text)
   - type (enum: text, number, select, date, relation, checkbox, formula, rollup)
   - config (jsonb) — type-specific config
   - order (int)

3. **database_rows**
   - id (text, PK)
   - database_id (text, FK)
   - block_id (text, FK) — links to blocks table
   - values (jsonb) — property values
   - created_at (timestamp)
   - updated_at (timestamp)

4. **database_views**
   - id (text, PK)
   - database_id (text, FK)
   - name (text)
   - type (enum: table, board, calendar, gallery, timeline)
   - config (jsonb) — view-specific filters, sorts, grouping
   - created_at (timestamp)

## Block Types (Slash Menu)

| Type | Status | Description |
| :--- | :---: | :--- |
| Heading 1/2/3 | ❌ | Markdown heading |
| Paragraph | ❌ | Default text block |
| Bulleted List | ❌ | Unordered list |
| Numbered List | ❌ | Ordered list |
| Toggle | ❌ | Collapsible content |
| Callout | ❌ | Highlighted note |
| Code | ❌ | Syntax-highlighted code |
| Quote | ❌ | Blockquote |
| Divider | ❌ | Horizontal rule |
| Database | ❌ | Inline database |
| Embed | ❌ | External content |
| Image | ❌ | Inline image |

## Implementation Order
1. Create Database schema and CRUD layer
2. Build rich block editor with slash menu
3. Implement table view with inline editing
4. Add board (Kanban) view
5. Add calendar view
6. Add gallery view
7. Add timeline view
8. Wire database rows to canvas nodes
9. Add basic formulas and rollups

## Risks
- Editor performance with large documents (>10k blocks)
- Slash menu UX at scale (>100 block types)
- View rendering performance (>1k rows)

## Tradeoff
Slash menu will be keyboard-first (type "/" to filter) rather than mouse-driven popover. This reduces visual clutter but requires user familiarity with command patterns.
