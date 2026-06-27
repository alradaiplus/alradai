# Notes

A fast, clean **notes app** with an orange card-grid UI, built with Next.js 14 (App
Router), Tailwind CSS, and **Supabase** for auth + data. Fully bilingual —
**English and Arabic (RTL)** — via `next-intl`.

## Features

- Email + password accounts (Supabase Auth) with secure, cookie-based sessions.
- Create, edit, delete, **pin**, **color**, and **search** notes.
- Notes are stored in Postgres and **synced across devices**, protected by
  Row-Level Security so each user only ever sees their own notes.
- English / Arabic with full right-to-left support.

## Tech stack

| Area      | Choice                                  |
| --------- | --------------------------------------- |
| Framework | Next.js 14 (App Router, Server Actions) |
| Styling   | Tailwind CSS                            |
| Auth + DB | Supabase (Postgres, Auth, RLS)          |
| i18n      | next-intl (`en`, `ar` + RTL)            |

## Getting started

### 1. Create a Supabase project

1. Create a project at <https://supabase.com>.
2. In the dashboard, open **SQL Editor** and run the contents of
   [`supabase/schema.sql`](./supabase/schema.sql). This creates the `notes`
   table, the `updated_at` trigger, and the Row-Level Security policies.
3. (For quick local testing) under **Authentication → Providers → Email**, you
   can turn **"Confirm email"** off so new sign-ups are logged in immediately.
   Leave it on for production.

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values from your project's
**Settings → API**:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to **/login**; create an
account, then start adding notes. Switch language with the **العربية / English**
toggle in the header.

## Scripts

| Script              | Description                |
| ------------------- | -------------------------- |
| `npm run dev`       | Start the dev server       |
| `npm run build`     | Production build           |
| `npm run start`     | Run the production build   |
| `npm run lint`      | ESLint                     |
| `npm run typecheck` | TypeScript type-check      |

## Project structure

```
app/
  [locale]/
    (auth)/login, (auth)/signup   # auth pages (redirect away if logged in)
    notes/                        # protected notes dashboard
    page.tsx                      # entry — redirects by auth state
  _actions/                       # Server Actions (notes CRUD, sign out)
components/
  auth/        AuthForm
  notes/       NotesView, NoteGrid, NoteCard, NoteEditor, NoteToolbar, EmptyState
  layout/      Navbar
  ui/          BrandMark, LanguageSwitcher
lib/
  supabase/    client / server / middleware helpers
  notes/       shared types + color palette
messages/      en.json, ar.json
supabase/      schema.sql
```

## Deploying

Deploy to any Next.js host (e.g. Vercel). Set the same `NEXT_PUBLIC_*`
environment variables in the host's project settings, and set
`NEXT_PUBLIC_SITE_URL` to your production URL. Add that URL under Supabase
**Authentication → URL Configuration** so email links resolve correctly.
