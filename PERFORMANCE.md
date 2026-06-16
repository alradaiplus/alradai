# Notes Canvas — Performance budgets

These are SLOs, not goals. CI gates each one before any merge to `main`.

| Surface | Metric | Budget | Current (v1) |
|---|---|---|---|
| Cold start | First paint of Today | < 300 ms (desktop) | ~120 ms (Tauri) / 220 ms (web Lighthouse local) |
| Capture overlay | Open → cursor | < 200 ms | ~70 ms (no LLM, no DB write on mount) |
| ⌘K Blocks search | p95 keystroke → result | < 50 ms on 50k blocks | < 30 ms on 5k via multi-entry tokens index |
| Today re-render | Caret move → frame | < 16 ms | Achieved via Zustand selectors + debounced recall |
| Board generation | 40 blocks → board ready | < 4 s | LLM-bound; v2 |
| Nightly synthesis | Per night | < 8 s | LLM-bound; runs in background |

## Current wins (already in code)

- **Zustand selectors** — every component subscribes to exactly the slice it
  needs, so a caret move in the editor never re-renders Recall, Commitments,
  or the Morning Paragraph.
- **Multi-entry indexes** on `blocks.tokens` and `blocks.tags` — search is
  O(log n) per token, intersected in memory.
- **Debounced writes** — the Today editor flushes the draft 600 ms after
  typing stops; one IndexedDB write per pause, not per keystroke.
- **Debounced Recall** — 400 ms after caret stops. No churn during typing.
- **Lazy embeddings backfill** — runs once per app boot in idle time, not
  blocking first paint.
- **Static export under Tauri** — `output: 'export'` produces a flat HTML
  bundle, no server, no hydration wait beyond React itself.

## v2 wins (queued)

- Native SQLite via `better-sqlite3` (desktop) and `op-sqlite` (mobile).
  Drop-in via the `core/db.ts` interface — UI unchanged.
- `sqlite-vec` for embedding ANN — replaces the linear cosine scan in
  `ai/features/recall.ts`. Same function signature.
- Viewport-virtualized Canvas list and Board surface.
- Service worker for sub-100 ms cold start on web.

## Risk register

- **IndexedDB on Safari iOS** — periodically wiped after 7 days of
  non-use. Mitigation: Tauri/native shells store in app-private dirs
  immune to this. PWA users get a `Storage.persisted()` prompt on
  first capture.
- **OpenRouter rate limits** — burst behavior on synthesis. The
  AgentQueue dedupes by `(feature, key, model)`; failures fall back
  silently (no toast spam) and retry next day for synthesis.
- **API key exfiltration** — keys live in IndexedDB on web; this is
  acceptable because the host page is first-party and Notes Canvas
  never embeds third-party scripts. Under Tauri, v2 moves the key
  into Stronghold (encrypted keystore).
