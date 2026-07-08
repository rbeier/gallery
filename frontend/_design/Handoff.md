# Gallery App — Engineering Handoff

Target: **Angular (standalone components) with SSR** (Angular Universal / `@angular/ssr`, hydration enabled).
Source of truth for the design: `Gallery.dc.html` (a working prototype). This document describes what to build; the prototype is a faithful visual/behavioral reference, not production code to port line-for-line.

---

## 1. Abstract overview

A minimalist, editorial photography portfolio for a single photographer ("Robin Beier"). It is **mobile-first** with a responsive desktop layout, and it supports **automatic dark mode** (follows OS preference) plus a manual light/dark toggle.

Core idea: the imagery leads, the chrome recedes. Typography is editorial (a display serif for headlines, a system sans for UI, a monospace for metadata). The palette is a warm neutral paper/ink scheme.

Primary things a visitor can do:
1. Browse **all photographs** in a masonry grid.
2. Browse **portfolios** (albums) and drill into one.
3. Open any photo as a **full detail page** with description + EXIF-style metadata, and page through neighbouring photos.
4. **Search & filter** the library by free text and by facets (tag, camera, place, year).

There is no auth, no CMS, no user accounts in scope. Content is a static/served dataset of photos + albums.

---

## 2. Why SSR matters here

- **SEO + shareability**: each photo and album should be a crawlable, linkable URL with proper `<title>`/OpenGraph meta. This is the main reason for SSR.
- **Fast first paint**: the grid and detail pages should render meaningful HTML on the server, then hydrate.
- **No-JS baseline**: server-rendered pages (grid, album, photo detail) should be readable without client JS. Interactive niceties (hover captions, theme toggle, keyboard nav) are progressive enhancements.

### SSR-specific requirements
- Enable **hydration** (`provideClientHydration()`).
- Theme (dark/light): the prototype reads `prefers-color-scheme` at runtime. On the server you cannot know the OS preference, so:
  - Render with CSS-variable tokens that default to light, and let a **CSS `@media (prefers-color-scheme: dark)`** block flip them with **no JS** (this avoids a flash and needs no server knowledge). See `globals.css`.
  - The manual toggle sets a `.dark`/`.light` class (or `data-theme`) on `<html>` and persists to `localStorage`; guard all `localStorage`/`window`/`matchMedia` access with `isPlatformBrowser` so SSR doesn't crash. Optionally persist the manual choice in a cookie so the server can emit the right class and avoid a toggle flash.
- Guard everything touching `window`, `document`, `matchMedia`, `localStorage`, `IntersectionObserver`, keyboard listeners with `afterNextRender()` / `isPlatformBrowser(PLATFORM_ID)`.
- Data fetching should use a service that works in both environments (`TransferState` to avoid double-fetching between server and client).
- Images in production will be real files — use `NgOptimizedImage` (`ngSrc`) with width/height and `priority` on above-the-fold images. The prototype uses CSS-gradient placeholders; replace with real assets + a low-quality blur-up placeholder if desired.

---

## 3. Design system

All tokens already exist in `tailwind.config.js` + `globals.css` (CSS variables, space-separated RGB channels so Tailwind `<alpha-value>` works). Reuse them directly.

### Color (semantic, theme-aware)
| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#f5f2ea` (warm paper) | `#17140f` | page background |
| `surface` | `#ffffff` | `#221e17` | raised elements, tab/arrow buttons |
| `ink` | `#241f18` | `#ece6d9` | primary text |
| `muted` | ~50% ink | ~55% ink | secondary text, labels |
| `line` | `rgba(ink,.12)` | `rgba(ink,.14)` | hairline dividers/borders |
| `chip` | `rgba(ink,.06)` | `rgba(ink,.09)` | subtle fills (search pill, tags) |

Rules: warm neutrals only; no saturated accents. Overlays on top of images use white text on a dark bottom-up gradient (`rgba(18,14,9,.74) → transparent`), independent of theme.

### Typography
- **Display serif**: `Newsreader` (Google Fonts, ital + optical sizes). Headlines, photo titles, album names, section headings.
- **Sans**: `system-ui, -apple-system, sans-serif`. Body copy, UI, nav.
- **Mono**: `IBM Plex Mono`. Metadata keys, counters, facet chips, eyebrows, back links.
- Fluid sizing via `clamp()` (no breakpoint jumps). Named steps in the config: `text-display`, `text-title`, `text-heading`, `text-meta`.
- Letter-spacing: uppercase mono eyebrows use `.14em`; wide labels `.2em`; serif headlines slightly negative (`-0.015em`).

### Spacing, radii, motion
- Radii: `tile` 8px (grid images), `card` 12px (album covers), `pill` 20px (chips/tabs/arrows are circular).
- Layout max-widths: mobile content `640px`; desktop `1180px`; wide (≥1300px) `1500px`.
- Motion: `rise` (opacity + 8px translateY, 0.4s) for grid items entering; `fade` (0.28s) for the photo page; theme crossfade 300ms on `background-color`/`color`. Hover caption fades opacity 0→1 over 0.25s. Keep motion subtle.

### Breakpoints (from prototype)
- Mobile: `< 880px` — 2 grid columns, icon nav, stacked photo page.
- Desktop: `≥ 880px` — 3 grid columns, text nav, side-by-side photo page.
- Wide: `≥ 1300px` — 4 grid columns, `1500px` container.

---

## 4. Data model

```ts
interface Photo {
  id: number;              // slug-able; prefer a string slug in production for URLs
  title: string;
  album: AlbumId;          // 'coast' | 'city' | 'still' | 'mount'
  camera: string;          // e.g. "Leica Q2"
  lens: string;            // e.g. "28mm"
  location: string;        // "Cornwall, UK"  (short form = text before first comma)
  date: string;            // "YYYY-MM"
  tags: string[];
  ratio: number;           // width / height, drives masonry + detail aspect
  description: string;
  src?: string;            // real image URL in production
  blurhash?: string;       // optional, for blur-up placeholder
}

interface Album {
  id: string;              // 'coast'…
  name: string;            // "Coastlines"
  description: string;
  // derived: coverPhoto (first photo in album), count
}
```

Derived helpers used throughout:
- `shortLocation(photo)` = `location.split(',')[0].trim()` (used in grid hover meta + facets).
- `formatDate('2024-09')` → `"Sep 2024"`.
- `meta(photo)` = `` `${camera} · ${shortLocation}` `` (hover + detail).

The prototype ships 16 photos across 4 albums as seed data — reuse it for fixtures. In production this comes from a service (`GalleryService`) reading a JSON manifest or an API; use `TransferState` so SSR fetch isn't repeated on the client.

---

## 5. Routes / workflows

Use the Angular Router with SSR routes. Suggested structure:

| Route | Screen | Notes |
|---|---|---|
| `/` | **Home / All photographs** | Editorial hero line, stat line ("16 images · 4 portfolios"), search entry pill, horizontal portfolios strip, then the full masonry grid. |
| `/albums` | **Portfolios index** | Eyebrow (photographer name) + "Portfolios" heading + responsive grid (2/3 cols) of album cover cards (cover, name, count, description). |
| `/albums/:albumId` | **Album detail** | Back link → `/albums`; album name, description, count; masonry grid of that album's photos. |
| `/search` | **Search & filter** | Serif search input (free text), four facet groups of toggle chips (Tag, Camera, Place, Year), live result count, masonry grid of results, empty state. Consider syncing state to query params (`?q=&tag=&camera=&place=&year=`) so results are linkable/SSR-able. |
| `/photo/:id` | **Photo detail (full page)** | Not a modal — a real routed page. Large image + caption panel (counter, title, description, metadata rows: Camera+lens, Location, Date, Portfolio; tag chips). Prev/next paging + keyboard (←/→, Esc). Back link returns to the originating list. |

### Key behaviors
- **View source scoping for prev/next**: when the user opens a photo from a list (all / album / search results), prev/next should cycle **that same ordered list**, wrapping around, and the counter shows `index / total` for that list. In SSR, derive the neighbour list from the referrer route + params (e.g. carry `?from=album:coast` or recompute the album list). The prototype passes the in-memory list; in Angular, resolve the list from route context so deep links still work.
- **Back link label** reflects origin: "All photographs" / album name / "Search".
- **Masonry**: balanced-column layout — distribute items into N columns by pushing each next item into the currently-shortest column (weight ≈ `1/ratio`). This is a simple greedy balance, done at render time; it must be deterministic on server + client to hydrate cleanly. Prefer computing columns in the component (pure function of the list + column count) rather than a JS-measuring masonry lib, so SSR output matches.
- **Grid tiles**: image only; **title + camera meta appear on hover** as a bottom overlay (desktop). On touch/mobile there's no hover — that's acceptable (title lives on the detail page); optionally always-show a caption on mobile if desired.
- **Search matching**: free text matches against title + description + camera + location + tags (case-insensitive substring). Facets are AND across groups, OR within a group; tags match if the photo has any selected tag.
- **Theme toggle**: flips `data-theme`/class on `<html>`, persists, and updates the glyph/label (◐ Dark / ◑ Light).

---

## 6. Components (suggested Angular breakdown)

Standalone components; keep presentational ones dumb (inputs/outputs) for easy SSR + testing.

- `AppShellComponent` — top bar (masthead → home, nav: Work/Albums/Search + theme toggle on desktop; icon row on mobile), themed root, `<router-outlet>`. Hidden/replaced on the photo detail route (the detail is a full-bleed page).
- `PhotoGridComponent` — inputs: `photos: Photo[]`, `columns: number`. Computes balanced columns (pure), renders `PhotoTileComponent`s. Deterministic for SSR.
- `PhotoTileComponent` — input: `photo`; image (aspect-ratio box, `NgOptimizedImage`), hover caption overlay; routerLink to `/photo/:id`.
- `AlbumStripComponent` — horizontal scroll of `AlbumCardComponent` (compact) for the home page.
- `AlbumCardComponent` — cover, name, count, (optional) description; routerLink to album.
- `AlbumGridComponent` — the `/albums` responsive grid.
- `SearchPageComponent` — search field + `FacetGroupComponent`s + result count + `PhotoGridComponent` + empty state; two-way binds to query params.
- `FacetGroupComponent` — label + toggleable `ChipComponent`s; output on toggle.
- `PhotoDetailComponent` — the full page: image pane (with prev/next circular buttons), caption panel (counter, title, description, `MetaRowComponent`s, tag chips), back link; keyboard handling via host listeners guarded for browser only.
- `ThemeService` — reads system preference (browser only), manages manual override, persists (cookie for SSR-consistent first render), exposes current theme.
- `GalleryService` — data access; `TransferState`-backed.

Shared pipes/utils: `shortLocationPipe`, `formatMonthPipe`, `photoMetaPipe`.

---

## 7. Styling approach

- Tailwind is already configured (`tailwind.config.js`) with the semantic tokens and `globals.css` defines the CSS variables + auto dark mode + body base. Wire Tailwind into the Angular build (`postcss`), import `globals.css` in `styles`.
- Prefer utility classes with the semantic tokens (`bg-bg text-ink border-line font-serif text-display`, `text-muted`, `bg-chip`, `rounded-tile`, `animate-rise`).
- Keep the auto dark-mode as a pure-CSS media query so it works during SSR with no flash; the manual toggle overlays via a class/`data-theme` selector (switch `darkMode` in the config to `'class'` or a `[data-theme="dark"]` selector strategy if you want the manual toggle to fully override the media query — currently set to `media`).
- Load fonts: `Newsreader` + `IBM Plex Mono` via `<link>` in `index.html` (preconnect + `display=swap`), or self-host for performance. Sans is `system-ui` (no download).

---

## 8. Assets

The prototype has **no real photos** — every image is a warm-neutral CSS gradient placeholder, and each photo carries a `ratio` so layouts are correct. Replace with real images:
- Provide multiple sizes / a responsive `srcset`; use `NgOptimizedImage`.
- Keep the `ratio` field (or derive from real dimensions) to preserve masonry + reserve space (avoids CLS, important for SSR).
- Optional blur-up (blurhash/LQIP) to mimic the current soft placeholder feel.

---

## 9. Out of scope / open questions for the product owner
- Real data source (static JSON manifest vs API/CMS?).
- Real photographer identity + copy (currently "Robin Beier" + placeholder descriptions).
- Whether mobile should show always-on captions (no hover on touch).
- Whether manual theme choice should override OS preference globally (recommend yes, via cookie for SSR).
- Pagination / lazy-loading for large libraries (prototype loads all 16 at once).

---

## 10. Reference files in this project
- `Gallery.dc.html` — the working prototype (behavior + exact visual reference).
- `Gallery.html` — a self-contained offline build (open in any browser to click through).
- `tailwind.config.js` — design tokens (colors, fonts, sizes, radii, max-widths, animations).
- `globals.css` — CSS-variable definitions + auto dark-mode + body base.
