# Step 0 — FOUR-PILLAR GAP AUDIT

### Pillar 1: Notion — Documents & Databases
| Capability | Status | Note |
| :--- | :---: | :--- |
| Rich block-based editor | ❌ | Currently a plain markdown textarea without a slash menu or block types. |
| Headings / lists / toggles / callouts / code / quote | ❌ | Content is stored and rendered as raw markdown text only. |
| Embeds (PDF, image, URL preview) | 🟡 | Attachment schema exists; no upload pipeline, no inline renderer. |
| Relational database node type | ❌ | No database concept in schema; only single 'Block' atom. |
| Typed properties | 🟡 | Tags + links only; no typed columns (number, date, select). |
| Table / Board / Calendar / Gallery / Timeline views | ❌ | No alternative structured views implemented. |
| Filters + sorts | 🟡 | Query DSL on tags / text; no per-view persistence. |
| Formulas / Rollups (basic) | ❌ | Not implemented. |
| Project = database view + linked nodes | ❌ | Project is a saved tag query; not a database. |

### Pillar 2: Obsidian — Knowledge Graph & Second Brain
| Capability | Status | Note |
| :--- | :---: | :--- |
| [[Wikilinks]] parser | 🟡 | Extracts ULIDs only; no title-based linking, no autocomplete. |
| Backlinks panel | ✅ | BlockEditorSheet renders backlinks via IndexedDB query. |
| Unlinked mentions | ❌ | Not implemented. |
| Daily notes | 🟡 | Today surface is implicitly today's entry; no calendar navigation. |
| Journal | ❌ | Explicitly out-of-spec per Noter v1. |
| Force-directed graph view | ❌ | CanvasSurface exposes a "Graph" tab; renderer not implemented. |
| Local graph per node | ❌ | Not implemented. |
| Tags as first-class | ✅ | Multi-entry Dexie index; query DSL; chip UI. |
| Tag pages | 🟡 | tag:foo query in Canvas; no dedicated tag surface. |
| Transclusion (live node embed) | ❌ | Not implemented. |

### Pillar 3: Miro — Infinite Canvas
| Capability | Status | Note |
| :--- | :---: | :--- |
| Nodes | ✅ | BoardNode persists position + cluster. |
| Connections (typed edges) | ✅ | supports / contradicts / derives / asks. |
| Multi-board | ✅ | listBoards + active board id in store. |
| Pan / zoom / pinch | ✅ | Pointer Events + two-pointer pinch. |
| Read-only board render | ✅ | Slice 1 functionality shipped. |
| Drag nodes / Edit edge labels / Re-layout | ❌ | Slice 2 deferred; manual manipulation not implemented. |
| Nesting / Grouping / Layers / Frames | ❌ | Not implemented. |
| Minimap / Templates | ❌ | Not implemented. |
| 60fps at 5k nodes | ❌ | Soft cap MAX_NODES=200; no virtualization. |

### Pillar 4: ChatGPT — Workspace-Aware AI
| Capability | Status | Note |
| :--- | :---: | :--- |
| Provider abstraction (multi-vendor) | ✅ | Provider interface; OpenRouter driver shipped. |
| Streaming completions | 🟡 | Interface defined; current calls non-streaming. |
| Token + cost accounting | 🟡 | agentRuns logs; no rate-limit enforcement beyond monthly cap. |
| Threaded AI conversation node | ❌ | No chat node type; AI outputs are currently static blocks. |
| Multi-step agent runtime | ❌ | Not implemented. |
| Visible agent workflow on canvas | ❌ | Not implemented. |
| Per-node AI actions menu | ❌ | Not implemented. |
| RAG over workspace | 🟡 | Local lexical embeddings + cosine; no hybrid + rerank. |
| Inline citations to source nodes | 🟡 | Synthesis emits [[id]]; not clickable in render. |
| Semantic relationship discovery | 🟡 | Recall uses cosine on lexical vectors. |

### Pillar 5: Cross-Pillar Integration Gaps
| Integration | Status | Note |
| :--- | :---: | :--- |
| One object model across all surfaces | 🟡 | Block works for Today/Canvas/Boards; not a DB row or chat thread. |
| Database row ⇔ canvas node | ❌ | No database rows exist. |
| Canvas node ⇔ graph node | ❌ | Graph view absent. |
| Wikilink resolves across all surfaces | 🟡 | Resolves to Block id; canvas / db / graph contexts unavailable. |
| Backlinks include canvas + db references | 🟡 | Backlinks count block.links; no canvas or db source. |
| Tags first-class across all four pillars | 🟡 | Block tags only; no db-property tags, no canvas tags. |
| AI reads typed db properties as context | ❌ | No db properties. |
| AI cites canvas / graph / db nodes | 🟡 | Cites Block ids only. |
| Backend persistence + multi-tenant | ❌ | Local-first IndexedDB; no Supabase, no auth, no RLS. |
| CRDT realtime | ❌ | Not present. |
| Same build → static export + server mode | 🟡 | NOTER_STATIC=1 works; no server runtime exists. |
| Production observability / billing | ❌ | None. |
