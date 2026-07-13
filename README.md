# rbeier.dev gallery

Personal photo gallery for [rbeier.dev](https://rbeier.dev): a server-side-rendered Angular frontend backed by a Strapi CMS, deployed as two Docker containers on a VPS.

## Stack

| Part | Tech |
|---|---|
| [frontend/](frontend/) | Angular 22 (standalone components, signals, SSR via `@angular/ssr` + Express 5), Tailwind CSS 4, service worker (PWA), Vitest, Biome |
| [cms/](cms/) | Strapi 5 with SQLite (`better-sqlite3`) |
| Deployment | Docker Compose, GitHub Actions → VPS over SSH |

Node is pinned to **24.x** across the repo (`.nvmrc` + `engines`, enforced with `engine-strict`) — the CMS's native `better-sqlite3` module is built against that ABI. Run `nvm use` before installing anything.

## Repository layout

```
frontend/   Angular app (SSR). Pages: home, album detail, photo detail, search
cms/        Strapi app. Content types: photo, album, tag, lens, location, global
            scripts/backup.sh — production backup of CMS database + uploads
.github/    deploy.yml — push-to-main deployment workflow
```

## Local development

Each app runs on its own dev server:

```sh
# CMS — Strapi with auto-reload on http://localhost:1337
cd cms
cp .env.example .env   # fill in the secrets
nvm use && npm install
npm run develop

# Frontend — Angular dev server on http://localhost:4200
cd frontend
nvm use && npm install
npm start
```

The frontend talks to the CMS via `STRAPI_BASE_URL` (defaults to the local Strapi instance in development).

On first start with an empty database, the CMS seeds itself with sample albums and the example photos in `cms/database/seeders/`, so the frontend has content to render right away.

Useful frontend scripts:

```sh
npm test          # Vitest unit tests
npm run check     # Biome lint + format check
npm run build     # production build (browser + server bundles)
```

## Production

Both apps ship as Docker images defined by their own `Dockerfile` and are orchestrated by [docker-compose.yml](docker-compose.yml):

- **cms** — Strapi on port 1337, SQLite database and uploads persisted to `./cms-data/`
- **frontend** — SSR server on port 4000, reaches the CMS at `http://cms:1337`

Both ports bind to `127.0.0.1` only; a reverse proxy on the host terminates TLS and exposes the site.

```sh
docker compose up --build -d
```

Secrets (Strapi `APP_KEYS`, JWT secrets, salts, encryption key) come from a `.env` file next to the compose file — see [cms/.env.example](cms/.env.example).

### Deployment

Every push to `main` triggers [deploy.yml](.github/workflows/deploy.yml): it SSHes into the VPS, resets the checkout at `/opt/rbeier.dev` to `origin/main`, writes the `.env` from repository secrets, and rebuilds the containers natively on the host (`docker compose up --build -d`).

### Backups

```sh
./cms/scripts/backup.sh
```

Snapshots the CMS SQLite database (WAL-checkpointed, pulled from the running container via `docker cp`) and the uploads directory into `$DATA_DIR/backups`, keeping 14 days by default. See the script header for the configurable environment variables. Requires the cms container to be running.

### Regenerate image formats

After changing Strapi's image breakpoint/format configuration, rebuild all derived image sizes:

```sh
./cms/scripts/backup.sh   # needs a running container
docker compose stop cms
docker compose run --rm cms node scripts/regenerate-formats.js
docker compose start cms
```
