# CrisisIQ

AI-powered real-time disaster response coordination: public need submission, volunteer registration and missions, coordinator ops map, and Claude-based triage via Netlify serverless functions.

## Stack

- React 18+ / Vite / TypeScript (strict)
- SCSS design tokens (`src/styles/_tokens.scss`)
- Supabase (Postgres, Auth, Realtime, RLS)
- Netlify (static site + `netlify/functions/`)
- Leaflet / react-leaflet (ops map)

## Local development

1. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. For Netlify functions locally, set `ANTHROPIC_API_KEY` (e.g. in `.env` for `netlify dev` or the Netlify UI in production).
3. Install and run:

```bash
npm install
npm run dev
```

For functions + Vite together:

```bash
npx netlify dev
```

## Supabase

Apply migrations and seed (Supabase CLI):

```bash
npx supabase db reset   # local only; applies migrations + seed.sql
```

## Deploy

Connect the repo to Netlify, set build command `npm run build`, publish directory `dist`, and configure dashboard env vars (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` if used server-side).

---

This project was bootstrapped with [Vite](https://vite.dev) + React + TypeScript. See Vite’s template docs for ESLint and optional React Compiler setup.
