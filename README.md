<p align="center">
  <img src="public/favicon-32.svg" width="64" height="64" alt="CrisisIQ logo" />
</p>

<h1 align="center">CrisisIQ</h1>

<p align="center">
  <strong>AI-powered real-time crisis response coordination platform</strong><br />
  Connecting people in need with verified volunteers and coordinators — backed by OpenAI intelligence, Supabase realtime data, and a fully serverless architecture.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss" alt="Tailwind v4" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Netlify-Serverless-00C7B7?logo=netlify" alt="Netlify" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Netlify Serverless Functions](#netlify-serverless-functions)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
  - [Supabase Setup](#supabase-setup)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [License](#license)

---

## Overview

**CrisisIQ** is a full-stack web platform designed for real-time disaster and emergency response coordination. It bridges three key user groups:

1. **Citizens** who need immediate help during a crisis.
2. **Volunteers** who register their skills and availability to respond.
3. **Coordinators** who triage incoming requests, match them with volunteers, and manage dispatch operations.

The platform uses **AI-powered triage** to assess urgency, **realtime Supabase subscriptions** for live status updates, an **interactive threat map** for situational awareness, and an **AI news digest** that fuses internal CrisisIQ data with external disaster feeds (GDACS, USGS, ReliefWeb).

---

## Key Features

### For Citizens (Public Users)
- **Emergency Help Request** — Submit a help request with description, location (GPS auto-detect), and urgency. No account required.
- **Real-time Request Tracking** — Track the status of your request via a unique ID (`/status/:id`) with live Supabase Realtime updates.
- **Live Crisis Stats** — Real-time statistics bar on the homepage showing total requests, critical/high counts, and pending items.
- **AI Chat Assistant** — A floating chatbot (available on all public pages) powered by OpenAI that answers questions about the system and provides live operational context from the database.

### For Volunteers
- **Self-Registration** — Register with skills, phone, and location at `/volunteer`.
- **Authenticated Dashboard** — View current assignments, update availability, and manage your profile at `/volunteer/dashboard`.

### For Coordinators
- **Secure Login** — Role-based authentication (`coordinator` role in Supabase user metadata).
- **Dispatch Panel** — View unassigned needs, browse available volunteers, and dispatch assignments at `/coordinator`.
- **Operations Map** — Placeholder for future interactive ops map at `/ops`.
- **Admin Overview** — Placeholder for AI-generated situation reports at `/ops/admin`.

### AI-Powered Intelligence
- **Auto-Triage** — Background process (`useTriage` hook) that runs `ai-triage` on new pending requests, producing urgency scores, category labels, coordinator briefs, and volunteer skill matches.
- **Threat Analysis** — Batch AI analysis of recent requests for the awareness map, with server-side caching (~5 min TTL).
- **News Digest** — Curated feed merging CrisisIQ submissions with GDACS, USGS, and ReliefWeb data, enhanced with optional OpenAI web search.
- **Situation Reports** — AI-generated sitrep summaries for incident commanders from aggregated needs/assignments/volunteer data.
- **CrisisIQ Assistant** — Multi-turn chatbot with live database context injection, PII stripping, suggested follow-ups, and safety rails (always defers to 119/1990 for real emergencies).

### Awareness & Intelligence
- **Global Awareness Map** (`/awareness`) — Leaflet-powered interactive map displaying active requests with AI-enriched threat markers (urgency, category, recommended actions).
- **AI News Page** (`/news`) — Filterable digest of crisis-related news from multiple sources, rendered with real-time data.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19 + TypeScript 6.0 (strict mode) |
| **Routing** | react-router-dom v7 |
| **Build Tool** | Vite 8 (`@vitejs/plugin-react`) |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) + Sass design tokens (`_tokens.scss`) |
| **Maps** | Leaflet + react-leaflet (awareness/threat map) |
| **Database & Auth** | Supabase (PostgreSQL, Auth, Realtime, Row Level Security) |
| **AI Provider** | OpenAI (`gpt-4o-mini` default for triage/chat; configurable for news) |
| **Backend** | Netlify Functions (Node.js, esbuild bundler) |
| **Deployment** | Netlify (static site + serverless functions + SPA redirect) |

---

## Project Structure

```
CrisisIQ/
├── public/                          # Static assets (favicon, images)
│   ├── favicon-32.svg               # App icon (SVG)
│   ├── favicon-32.png               # App icon (PNG fallback)
│   └── image03.png                  # Brand mark source
│
├── netlify/
│   └── functions/                   # Serverless API endpoints
│       ├── ai-chat.js               # CrisisIQ Assistant chatbot
│       ├── ai-news.js               # AI news digest + external feeds
│       ├── ai-sitrep.js             # AI situation report generator
│       ├── ai-threats.js            # Batch threat analysis for map
│       ├── ai-triage.js             # Per-request AI triage
│       ├── package.json             # Function-specific dependencies
│       └── utils/
│           ├── openai.js            # OpenAI API helpers (chat + responses)
│           ├── supabaseAdmin.js     # Server-side Supabase client
│           ├── feeds.js             # External feed fetchers (GDACS, USGS, etc.)
│           └── chatContext.js       # Live data snapshots for chat (PII-stripped)
│
├── src/
│   ├── App.tsx                      # Root component with routing + auth guards
│   ├── main.tsx                     # React entry point
│   ├── index.css                    # Global styles + Tailwind directives
│   │
│   ├── assets/                      # Static imports (images, etc.)
│   ├── auth/                        # Auth helper utilities
│   ├── context/                     # React context providers
│   │   ├── AppContext.tsx            # Global app state (crisis events, etc.)
│   │   └── SupabaseContext.tsx       # Supabase client provider
│   │
│   ├── components/
│   │   ├── awareness/               # Threat map components (4 files)
│   │   ├── brand/                   # CrisisIQ brand mark/logo component
│   │   ├── chat/                    # AI Assistant UI (7 files)
│   │   │   ├── CrisisChatLauncher   # Floating action button (FAB)
│   │   │   ├── CrisisChatWindow     # Chat window (desktop + mobile)
│   │   │   ├── ChatMessageBubble    # Individual message rendering
│   │   │   ├── ChatComposer         # Message input area
│   │   │   ├── QuickPromptChips     # Suggested prompt buttons
│   │   │   ├── markdown.ts          # Safe markdown → HTML renderer
│   │   │   └── CrisisChat.css       # Animations & keyframes
│   │   ├── news/                    # AI news digest components (3 files)
│   │   ├── public/                  # Public page components (12 files)
│   │   │   ├── PublicPageShell      # Layout shell for public pages
│   │   │   ├── LiveCrisisStats      # Real-time stats bar
│   │   │   ├── EmergencyBar         # Emergency hotline banner
│   │   │   └── ...                  # Forms, hero, submission UI
│   │   └── volunteer/               # Volunteer/coordinator components (15 files)
│   │       ├── CoordinatorNavbar    # Coordinator navigation
│   │       ├── VolunteerTopBar      # Volunteer navigation
│   │       └── ...                  # Dashboard cards, assignment UI
│   │
│   ├── hooks/
│   │   ├── useCrisisChat.ts         # Chat state management hook
│   │   ├── useTriage.ts             # Background AI triage hook
│   │   └── useReducedMotion.ts      # Accessibility: motion preference
│   │
│   ├── services/
│   │   ├── supabase.ts              # Supabase queries + realtime subscriptions
│   │   ├── chat.ts                  # Chat API client (→ ai-chat function)
│   │   └── ...                      # Other service modules
│   │
│   ├── pages/                       # Route-level page components (12 files)
│   ├── styles/                      # Sass tokens + base styles
│   │   ├── _tokens.scss             # Design tokens (colors, spacing)
│   │   ├── _base.scss               # Base element styles
│   │   └── main.scss                # Sass entry point
│   │
│   ├── types/
│   │   └── index.ts                 # All TypeScript type definitions
│   │
│   ├── data/                        # Static data files
│   └── lib/                         # Utility libraries
│
├── supabase/
│   ├── config.toml                  # Supabase CLI project config
│   ├── seed.sql                     # Database seed data
│   └── migrations/                  # SQL migration files (8 migrations)
│       ├── 20250516_initial_schema
│       ├── 20250517_volunteers_availability
│       ├── 20250518_volunteers_available_boolean
│       ├── 20250519_volunteers_user_id_unique
│       ├── 20250520_volunteers_grants
│       ├── 20250521_help_requests
│       ├── 20250522_profiles_and_requests
│       └── 20250523_assignments_grants
│
├── .env.example                     # Environment variable template
├── netlify.toml                     # Netlify build + function config
├── vite.config.ts                   # Vite build configuration
├── tsconfig.json                    # TypeScript base config
├── tsconfig.app.json                # TypeScript app config
├── tsconfig.node.json               # TypeScript node config
├── package.json                     # Dependencies and scripts
└── README.md                        # This file
```

---

## Pages & Routes

| Route | Page | Access | Description |
|-------|------|--------|-------------|
| `/` | Home | Public | Landing page with "I Need Help" / "I Want to Help" CTAs, live crisis stats, about section, how-it-works guide, and volunteer sign-in. |
| `/submit` | PublicSubmit | Public | Anonymous emergency help request form with GPS location, description, and contact info. |
| `/status/:id` | RequestStatus | Public | Real-time tracking page for a submitted request — shows current status, assignment info, and live updates. |
| `/awareness` | GlobalAwareness | Public | Interactive Leaflet map with AI-enriched threat markers, active request list, and urgency indicators. |
| `/news` | AiNews | Public | AI-curated crisis news digest merging CrisisIQ data with GDACS, USGS, and ReliefWeb feeds. |
| `/volunteer` | VolunteerRegister | Public | Volunteer registration form (skills, phone, location). |
| `/volunteer/dashboard` | VolunteerDashboard | Auth | Volunteer dashboard: current assignments, availability toggle, profile management. |
| `/coordinator/login` | CoordinatorLogin | Public | Coordinator sign-in (email/password, requires `coordinator` role). |
| `/coordinator` | CoordinatorPanel | Coordinator | Dispatch panel: unassigned needs queue, available volunteers, assignment creation, live stats. |
| `/ops` | OpsMap | Coordinator | Operations map (planned — placeholder). |
| `/ops/admin` | AdminOverview | Coordinator | Admin overview with AI sitrep (planned — placeholder). |

**Floating UI:** The **CrisisIQ Assistant** chatbot appears as a floating action button on all public pages via `PublicPageShell`.

---

## Netlify Serverless Functions

All functions live in `netlify/functions/` and are deployed as serverless endpoints at `/.netlify/functions/<name>`.

| Function | Method | Description |
|----------|--------|-------------|
| `ai-chat` | POST | Multi-turn AI chatbot. Injects live database snapshots (PII-stripped), maintains conversation context, returns reply + suggested follow-ups. |
| `ai-triage` | POST | Per-request AI triage. Analyzes a need description + nearby volunteer skills, returns urgency score, category, coordinator brief, and skill matches. |
| `ai-threats` | POST | Batch threat analysis for the awareness map. Processes recent requests into urgency/category/summary/actions. 5-minute server cache. |
| `ai-news` | GET | Curated news digest. Merges CrisisIQ submissions with GDACS, USGS, and ReliefWeb feeds. Optional web search via OpenAI Responses API. 10-minute cache. |
| `ai-sitrep` | POST | Situation report generator for coordinators. Produces incident commander briefs from needs, assignments, and volunteer data. |

**Shared utilities** in `netlify/functions/utils/`:
- `openai.js` — OpenAI Chat Completions + Responses API wrappers
- `supabaseAdmin.js` — Server-side Supabase client (service role key)
- `feeds.js` — External disaster feed fetchers
- `chatContext.js` — Live Supabase snapshot builder with PII stripping and 30-second cache

---

## Database Schema

CrisisIQ uses **Supabase** (PostgreSQL) with **Row Level Security** enabled. Key tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles linked to Supabase Auth (name, role, metadata) |
| `requests` | Public help requests (description, location, urgency, status, contact info) |
| `needs` | Internal need records (may mirror or extend requests for coordinator workflow) |
| `volunteers` | Registered volunteers (skills, phone, location, availability) |
| `assignments` | Volunteer-to-need dispatch records (status: assigned, en_route, completed) |
| `crisis_events` | Crisis event definitions (name, region, active status) |

**8 migrations** handle schema evolution from initial setup through grants and constraints.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **Netlify CLI** (`npm install -g netlify-cli` or use `npx netlify`)
- **Supabase account** (free tier works) — [supabase.com](https://supabase.com)
- **OpenAI API key** — [platform.openai.com](https://platform.openai.com)

### Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Scope | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | Frontend | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase anonymous/public key |
| `OPENAI_API_KEY` | Server | OpenAI API key (used by Netlify functions only) |
| `OPENAI_MODEL` | Server | Model for triage/chat/sitrep (default: `gpt-4o-mini`) |
| `OPENAI_NEWS_MODEL` | Server | Model for news digest with web search (default: `gpt-4o-mini`) |
| `SUPABASE_URL` | Server | Supabase URL for server-side access |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase service role key (full access, server-side only) |

> **Security note:** `VITE_`-prefixed variables are embedded in the frontend bundle and safe to expose. All other variables are server-side only and must never be exposed to the browser.

### Installation

```bash
git clone https://github.com/RadinReanula/CrisisIQ.git
cd CrisisIQ
git checkout CrisisIQ_Redesigned
npm install
```

### Running Locally

**Frontend only** (no serverless functions):

```bash
npm run dev
```

**Full stack** (Vite + Netlify Functions on port 8888):

```bash
npx netlify dev
```

The app will be available at `http://localhost:8888`.

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Copy your project URL and keys into `.env`.
3. Apply migrations and seed data:

```bash
# Using Supabase CLI (local development)
npx supabase db reset       # Applies all migrations + seed.sql

# Or apply migrations to remote project
npx supabase db push
```

4. Ensure **Row Level Security** is enabled on all tables (migrations handle this).
5. For the coordinator role, create a user in Supabase Auth with `user_metadata.role = 'coordinator'`.

---

## Deployment

### Netlify (Recommended)

1. Connect the repository to [Netlify](https://netlify.com).
2. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions` (auto-detected from `netlify.toml`)
3. Set environment variables in Netlify Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (Optional) `OPENAI_MODEL`, `OPENAI_NEWS_MODEL`
4. Deploy. The SPA redirect rule in `netlify.toml` handles client-side routing.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | Run ESLint across the project |
| `npm run preview` | Preview the production build locally |
| `npx netlify dev` | Full-stack local dev (Vite + Netlify Functions) |

---

## License

© 2026 CrisisIQ. All rights reserved.

---

<p align="center">
  <strong>In an emergency, always call 119 first.</strong>
</p>
