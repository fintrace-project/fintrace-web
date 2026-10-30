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
  `./run.sh npx shadcn@4.22.0 add <name>`; they live in `src/components/ui` as our own code. When it
  asks to overwrite an existing component it waits for an answer `./run.sh` cannot give: add
  `--overwrite`, then `git checkout` the files that were already ours (`button.tsx`).
- **ECharts** for charts (from 4.9), loaded only on the screens that show them.
- **lucide-react** for icons.
- **i18next** for messages, read through **react-i18next** in the UI (agreed 2026-10-30).

Adding a library outside this list needs the owner's agreement first.

## Layers

- `src/core/` — **framework-free**: the API client (`src/core/api/`, generated), formatting, dates,
  request and state logic. It must not import React or any UI code; `oxlint` enforces that. It is
  what a mobile app (M7) would reuse unchanged.
- Everything else is the UI layer: `src/pages/` (one file per route), `src/components/` (app
  components), `src/components/ui/` (shadcn/ui), `src/lib/` (UI helpers), `src/hooks/`.

## Rules

- **No UI text in the code.** Every string the user sees or hears — labels, buttons, empty states,
  client-side errors, `aria-label`s, `title`s — is a key in `src/core/i18n/en.yml`, read with
  `useTranslation()` in the UI and `t` from `@/core/i18n` in `src/core`. Emphasis inside a sentence is
  `<b>` in the message and `<Trans>` in the component; plurals are `key_one` / `key_other`. Pass whole
  sentences, never fragments to concatenate. After editing the YAML, run `npm run generate:messages`:
  it rewrites `en.d.yml.ts`, the keys' type, and CI fails on a stale one. Server text (Core's
  `detail`, the importer's messages) and what `Intl` formats are not ours to translate.
- **No money arithmetic in the client, ever.** Core computes every balance, total and conversion;
  the client formats what it receives. An operation's amount is a magnitude plus a `kind` on the
  wire — show the sign from the kind, never compute it into a figure.
- **The API client is generated from Core's `openapi.json`, never hand-written.** Call Core through
  `api` from `@/core/api`; the types come from the Core release pinned as `coreApiVersion` in
  `package.json`. Two calls are written by hand, on the generated types: `listWorkspaces`, until a
  Core release documents paging as `page`, `size` and `sort`; and `importDump`, the upload to an
  importer — outside Core's spec — whose 422 carries the failed job as the result to show. A new
  import source is an entry in `src/core/import-sources.ts` and a route in the BFF.
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
./run.sh npm run generate:api   # src/core/api/schema.d.ts from the pinned Core release
./run.sh npm run generate:messages   # src/core/i18n/en.d.yml.ts from en.yml
```

For an unreleased spec, copy it inside this repository first — `./run.sh` mounts only this
directory — and name it: `cp ../fintrace-core/openapi.json core-openapi.json && ./run.sh npm run
generate:api -- core-openapi.json`. `core-openapi.json` is git-ignored; CI regenerates from the pin.

**Verify with `./run.sh npm run format:check && ./run.sh npm run lint && ./run.sh npm run build`** —
CI runs the same three.

**The dev loop is the BFF's origin**: from the workspace root, `./run-local.sh core bff web -d`
builds the `Dockerfile`'s `dev` stage — Vite over this working tree — and serves the app at
`http://localhost:8100`, with login, `/api` and hot reload. The BFF's dev CSP allows Vite's inline
scripts and styles only there; the production policy does not. `./run.sh dev` on port 5173 shows the
UI alone, with no session and no API.

## Not here yet

`listWorkspaces` on the generated client (4.2's last item, waiting for a Core release); whether a
session exists, without being sent to sign-in, and its expiry (5.2h's `/auth/session`, the last of
4.2e); the accounts' writes (4.4); the production image and its release (4.2d); Playwright flows and
the performance budget (4.2f) — the bundle is already 194 kB gzipped of 150 kB, so routes loaded on
demand come with it. A second language is post-MVP: a second YAML file beside `en.yml`.
