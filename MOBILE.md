# Notes Canvas — Mobile

Mobile is for **capture** and **triage**. Not for the Canvas.

## v1 (this branch)

Responsive web UI. The same React tree at `/` collapses under 720px:

- Bottom-nav (Today / Canvas / Inbox) lives in the header on desktop,
  and as a horizontal segmented tab row on mobile via the same Header
  component.
- Capture Overlay becomes a full-width sheet at 92vw.
- Settings Sheet covers 100vw.
- Canvas sidebar (saved queries) hides; the query bar remains.

This is enough for PWA install on iOS/Android and covers ~95% of the
mobile capture-and-triage use case at zero extra engineering cost.

## v2 — native (planned, off-branch)

`apps/mobile/` (Expo, React Native, TypeScript) re-uses:

| Module           | Shared with web/desktop? |
|------------------|--------------------------|
| `src/core/*`     | Yes (pure TS, no DOM)    |
| `src/ai/*`       | Yes                      |
| `src/store/*`    | Yes                      |
| `src/components` | No (RN-native components)|

Storage swap:
- `core/db.ts` → `op-sqlite` driver. Same exported API. Same schema.
- Embeddings → `react-native-mlkit` (BGE-small Core ML) on iOS,
  `transformers-react-native` on Android.

Screens:

1. **Capture** — opens to cursor in <100 ms.
   - Action Button on iPhone routes here directly.
   - Voice button uses `expo-speech-recognition` (on-device).
   - Photo button captures via camera + OCR (VisionKit / ML Kit).
2. **Inbox** — stack of cards. Swipe right files, left archives,
   up sends to Today, down opens re-tag sheet.
3. **Today** — same MorningParagraph / Commitments / TodayEditor /
   RecallColumn, RN-styled.

Bottom nav: 3 tabs only. No Canvas. No Settings tab — opens from
long-press on the avatar in the header.

Sync: Yjs CRDT doc-per-Block (v2 desktop too). The mobile app
connects to the same E2E-encrypted relay.
