# Notes Canvas

> Notes Canvas captures every thought, links them automatically, and tells
> you what you were really thinking about.

A second brain for high-performance people. Carbon-black, Apple-restraint,
Linear-speed. Built to the v1 spec — nothing more.

## What ships in v1

- **Today** — Morning Paragraph, three Commitments, today's writing
  surface, Recall column.
- **Capture Overlay** — `⌘⇧Space` from anywhere. Files to Inbox in
  one keystroke.
- **Inbox** — keyboard-first triage (`J`/`K` move, `F` file, `E`
  archive).
- **Canvas** — query DSL (`tag:` `is:` `before:` `after:` + text)
  with saved-query sidebar and list view.
- **Command Bar** — `⌘K` global. Blocks · Tags · Commands tabs.
- **Block Editor** — sheet, backlinks, autosave.
- **Settings** — OpenRouter BYO-key, per-feature model selection,
  temperature, reasoning level, monthly cap.
- **Recall agent** — on-device lexical embeddings, no key required,
  no network.
- **Nightly Synthesis** — once-per-day, opens with the agent's
  paragraph the next morning.

Not shipped in v1 (per spec): Spatial Boards, Contradiction
detection, Thread discovery, Apple Watch, mobile native, Yjs sync.

## Architecture

```
app/                     Next.js 14 entrypoint (mounts <Shell/>)
src/
  core/                  Pure TS — no DOM, no React
    types.ts             Block, Board, Commitment, Settings
    db.ts                Dexie/IndexedDB schema + queries
    query.ts             Query DSL parser
    ids.ts               ULID
    text.ts              tokenize, tags, links, excerpt
    time.ts              date helpers
    tauri.ts             Tauri runtime bridge (no-op on web)
  ai/
    provider.ts          Provider interface
    openrouter.ts        OpenRouter driver (v1 default)
    embeddings.ts        On-device lexical embeddings
    queue.ts             AgentQueue: dedupe + cost guard
    features/
      recall.ts          Surface relevant past blocks
      synthesis.ts       Nightly paragraph
  store/                 Zustand stores
  hooks/                 useHotkey, useDebounced, useAutosize
  components/
    shell/               Shell, Header, FAB, Toaster
    primitives/          Icon, Button, IconButton, Sheet, TagChip, KeyHint
    surfaces/            TodaySurface, CanvasSurface, InboxSurface
    today/               MorningParagraph, Commitments, TodayEditor, RecallColumn
    canvas/              BlockRow
    inbox/               InboxCard
    overlays/            CaptureOverlay, CommandBar, SettingsSheet, BlockEditorSheet
  styles/                tokens.css, components.css
src-tauri/               Tauri 2 desktop wrap
  src/main.rs            Shell — registers ⌘⇧Space, emits nc:capture
  tauri.conf.json
  Cargo.toml
  capabilities/main.json
```

## Run on the web

```bash
npm install
npm run dev
# open http://localhost:3000
```

First launch opens Settings. Paste your **OpenRouter** key and test it.
Recall works without a key (on-device). Synthesis needs one.

## Run on desktop (Tauri 2)

Requires Rust toolchain.

```bash
npm install
cargo install tauri-cli --version "^2.0"
cargo tauri dev
```

The desktop shell registers `⌘⇧Space` (or `Ctrl+Shift+Space` on Linux)
globally and routes it through `window.__TAURI__.event` into the same
React Capture Overlay.

## Run on mobile

v1 is responsive web. The same `/` URL collapses to a single column
under 720 px and exposes Today, Canvas, and Inbox via the header.
Native React Native app is queued for v2 — see [MOBILE.md](./MOBILE.md).

## Keyboard

| Shortcut | Action |
|---|---|
| `⌘K` | Command bar |
| `⌘,` | Settings sheet |
| `⌘⇧Space` | Capture overlay |
| `⌘1` / `⌘2` / `⌘3` | Switch to Today / Canvas / Inbox |
| `⌘↵` | End block (Today editor) |
| `⌘1..3` (in editor) | Toggle Commitment 1/2/3 |
| `J` / `K` | Move focus in Inbox |
| `F` | File focused Inbox card |
| `E` | Archive focused Inbox card |
| `Esc` | Dismiss overlay |

## AI providers

v1 ships **OpenRouter only** because one key unlocks every model. The
provider abstraction in `src/ai/provider.ts` is ready for OpenAI,
Anthropic, Gemini, and local (Ollama) drivers — those are wired in v2.

Keys live in IndexedDB on the web build and never leave the device.
Under Tauri, v2 migrates them to OS Keychain via Stronghold. No key
is ever embedded in the bundle.

## Performance

See [PERFORMANCE.md](./PERFORMANCE.md). v1 SLOs:

- Cold start → Today: **< 300 ms**
- Capture open → cursor: **< 200 ms**
- ⌘K Blocks search p95 (50k blocks): **< 50 ms**
- Today re-render on caret: **< 16 ms**

## Roadmap

- **v1 (now)** — this README.
- **v2** — Spatial Boards (AI-arranged + manual), Contradiction
  Detection, Thread Discovery, OpenAI/Anthropic/Gemini drivers, native
  iOS app, Yjs CRDT sync, native SQLite.
- **v3** — Local model driver, web app over WebCrypto, voice answers
  via AirPods, continuous (not just nightly) synthesis, shared boards.

## Philosophy

One atom: **Block**. Two surfaces: **Today** + **Canvas**. One
**Inbox**. One **Command Bar**. One **Ambient Agent**. Nothing else.
