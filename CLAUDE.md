# CLAUDE.md — fintrace-web

The fintrace web UI: a single-page React app, the pilot's only UI, served through the BFF. This
repository is one checkout of the fintrace workspace; the workspace's `CLAUDE.md` and `docs/` hold
the architecture. The decisions behind this repository are `docs/design-decisions.md` §3.6 (the UI)
and §3.3 (the BFF as the edge), and spike 4.1 (`docs/spikes/4.1-frontend-framework.md`).

## How work happens here

**Agent-oriented development.** An agent writes the code; the owner plans, reviews and approves
every step. So: propose a plan per task before writing, keep each diff small enough to review,
and explain the React or TypeScript pattern a change introduces in the reply — not in code
comments. One task at a time; no running ahead.

## The stack — pinned, do not swap

- **React 19** with **TypeScript `strict`**, built by **Vite**.
- **React Router** (data router: `createBrowserRouter`) for routing.
- **TanStack Query** for all server data. No global store: nearly all state is server state; the
  session and the current user go in React context when they arrive.
- **shadcn/ui** (Radix, Nova preset) over **Tailwind 4**. Add components with
  `./run.sh npx shadcn@4.22.0 add <name>`; they live in `src/components/ui` as our own code.
- **ECharts** for charts (from 4.9), loaded only on the screens that show them.
- **lucide-react** for icons.

Adding a library outside this list needs the owner's agreement first.

## Layers

- `src/core/` — **framework-free**: the API client (generated, from 4.2b), formatting, dates,
  request and state logic. It must not import React or any UI code; `oxlint` enforces that. It is
  what a mobile app (M7) would reuse unchanged.
- Everything else is the UI layer: `src/pages/` (one file per route), `src/components/` (app
  components), `src/components/ui/` (shadcn/ui), `src/lib/` (UI helpers), `src/hooks/`.

## Rules

- **No money arithmetic in the client, ever.** Core computes every balance, total and conversion;
  the client formats what it receives. An operation's amount is a magnitude plus a `kind` on the
  wire — show the sign from the kind, never compute it into a figure.
- **The API client is generated from Core's `openapi.json`, never hand-written** (from 4.2b).
- **Timestamps are floating local wall-clock values** (`YYYY-MM-DDTHH:mm`): never convert to UTC.
- **No token in JavaScript.** The BFF holds the session; the browser has only a cookie.
- **Mobile-first**: lay out for a phone first, widen from `md`. No hover-only controls; touch
  targets about 44 px. On a touch screen a chart must let one finger scroll the page (spike 4.1).
- **Effects depend on primitives** (ids, strings), not objects that are refetched — a new object
  re-runs the effect. React's hook lint rules are on; fix what they report rather than silencing it.

## Commands

Node runs in Docker only — `./run.sh` wraps `node:22` as the calling user:

```bash
./run.sh npm install
./run.sh dev                    # http://localhost:5173
./run.sh npm run format         # Prettier
./run.sh npm run lint           # oxlint, warnings fail
./run.sh npm run build          # type-check and production build
```

**Verify with `./run.sh npm run format:check && ./run.sh npm run lint && ./run.sh npm run build`** —
CI runs the same three.

## Not here yet

The generated API client (4.2b), the image, Compose service and release (4.2d), Playwright flows and
the performance budget (4.2f), and the dev loop on the BFF's origin (once M5 exists).
