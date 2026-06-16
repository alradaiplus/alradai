# Noter

A premium life operating system. Carbon-black, Apple-inspired.

This branch (`Noter`) is fully standalone — it shares no history with any
other branch in the repo.

## Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Plain CSS (no Tailwind, no UI libraries)

## Current surface

- `/` — **Tracker**. November 2026 habit grid, monthly stats, area /
  ring / weekly-bar analytics, right rail with Today's Habits, Current
  Streaks, Best Performing, Needs Attention, and a floating bottom nav
  for Home · Brain Canvas · Projects · Tracker · Journal.

## Run

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy

Push this branch to your hosting provider (Vercel auto-detects Next.js).
Point the project's "Production Branch" at `Noter` and no further config
is needed.
