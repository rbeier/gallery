# CLAUDE.md

Instructions for AI coding agents working in this repository. For a human-oriented overview see [README.md](README.md).

## What this is

Personal photo gallery for rbeier.dev. Two apps in one repo:

- `frontend/` — Angular 22 SSR app (standalone components, signals, Tailwind CSS 4, Express 5 server, service worker). Pages: home, album detail (`/albums/:albumId`), photo detail (`/photo/:id`), search.
- `cms/` — Strapi 5 with SQLite (`better-sqlite3`). Content types: `photo`, `album`, `tag`, `lens`, `location`, `global` (single type).

## Hard requirements

- **Node 24.x only.** Pinned via `.nvmrc` + `engines` + `engine-strict`. Always `nvm use` before installing or running anything. Never downgrade — `better-sqlite3` is a native module built against the Node 24 ABI; a mismatched Node breaks the CMS.
- **Pushing to `main` deploys to production.** `.github/workflows/deploy.yml` triggers on every push to `main` and rebuilds the live containers on the VPS. Do not push to `main` unless the user explicitly asks.
- Frontend code style is enforced by **Biome** (not ESLint/Prettier): `npm run check` in `frontend/`. No semicolons, single quotes — always run Biome rather than guessing.

## Commands

All frontend commands run from `frontend/`, CMS commands from `cms/`:

```sh
# frontend
npm start           # dev server on http://localhost:4200
npm test            # Vitest unit tests
npm run check       # Biome lint + format check
npm run format      # Biome format --write
npm run build       # production build (browser + server bundles)
npm run serve:ssr:gallery   # run the built SSR server on :4000

# cms
npm run develop     # Strapi with auto-reload on http://localhost:1337 (admin at /admin)
npm run build       # build the Strapi admin panel
```

CMS needs a `.env` (copy `cms/.env.example`). The frontend dev server expects the CMS on `http://localhost:1337`.

`.claude/launch.json` defines the `gallery-dev` (ng serve, :4200) and `gallery-ssr` (built server, :4000) launch configs for browser preview.

## Architecture notes

- Data flow: the frontend fetches the **entire dataset in one shot** (`StrapiService.fetchGallery()` — photos, albums, global profile) and renders from that in-memory model. There is no per-page API querying; new data needs go through `frontend/src/app/services/strapi.service.ts` and the `GalleryData` model.
- **Two Strapi base URLs, deliberately separate** (`frontend/src/app/config/strapi.config.ts`):
  - `STRAPI_BASE_URL` — API calls. On the SSR server this is the internal container host (`http://cms:1337`), which browsers cannot reach.
  - `STRAPI_MEDIA_URL` — image URLs baked into rendered HTML. Origin-relative in production, `http://localhost:1337` in dev. Never build `<img>` URLs from `STRAPI_BASE_URL`; SSR would embed the unreachable container host.
- **Full-resolution originals are intentionally private.** `viewerUrl()` caps viewer images at `VIEWER_MAX_WIDTH` (2000px) and never serves the raw original. Do not "fix" this by exposing the original URL.
- Blur-up placeholders (`lqip`) are inline WebP data URIs that Strapi attaches to the `thumbnail` format only. They are generated at upload time; after changing image format config, regenerate via `cms/scripts/regenerate-formats.js` (see README).
- Production runs both apps as Docker containers (`docker-compose.yml`), ports bound to `127.0.0.1` behind a host reverse proxy. CMS data persists in `./cms-data/` on the host.

## Frontend conventions

Detailed Angular/TypeScript rules live in [frontend/CLAUDE.md](frontend/CLAUDE.md) — read it before writing frontend code. The load-bearing ones:

- Standalone components only; do **not** write `standalone: true` (default) or `changeDetection: OnPush` (default in v22).
- Signals for state, `computed()` for derived state, `inject()` over constructor injection, `input()`/`output()` functions over decorators.
- Native control flow (`@if`, `@for`, `@switch`); `class`/`style` bindings instead of `ngClass`/`ngStyle`; host bindings in the `host` object, not decorators.
- Exactly one exported class/interface/enum per file; models live in `frontend/src/app/models/` as one-type-per-file.
- Accessibility is a requirement, not a nice-to-have: WCAG AA, passes AXE checks.

## CMS conventions

- Content-type schemas live in `cms/src/api/<type>/content-types/<type>/schema.json`. Changing them alters the SQLite schema on next start — treat production data with care and mention migration implications to the user.
- Strapi v5 REST shape: list responses are `{ data: [...] }` with attributes flattened onto each entry (no `attributes` nesting like v4).
- Seeding: on bootstrap with an empty database, `cms/src/index.ts` creates sample albums/tags/lenses/locations (`cms/src/seed-data.ts`, deterministic metadata from `cms/src/seed-generate.ts`) and uploads the example images from `cms/database/seeders/`. That directory is excluded from the Docker build (`cms/.dockerignore`), so production never auto-seeds.

## Verifying changes

For frontend changes, run `npm run check` and `npm test` in `frontend/`, then verify visually via the `gallery-dev` launch config (needs the CMS running for real data). For SSR-affecting changes (meta tags, initial render, media URLs), build and check the `gallery-ssr` config instead — dev mode and SSR resolve Strapi URLs differently, so dev-mode behavior does not prove SSR behavior.
