# Next.js Migration — Design

Date: 2026-10-02
Status: Draft, pending written-spec review
Repo: `Portfolio-webpage`
Authored on: `main` @ `f594fdf` (specs land on `main`; see
`docs/superpowers/specs/2026-10-01-repo-restructure-design.md`)
Implemented on: `feature/nextjs-migration`, which is currently **17 commits behind
`main`** and must be reset onto it before checkpoint 1 — otherwise the migration
would start from the pre-restructure tree, without `scripts/deploy.sh`,
`scripts/check-assets.mjs`, or the corrected `AGENTS.md`
Predecessor: `docs/superpowers/specs/2026-10-01-repo-restructure-design.md`

## Problem statement

The public site is four hand-written HTML files plus `js/app.js`, which mutates the
DOM after load from data fetched out of the PostgreSQL-backed API. It works, but the
content is only correct *after* JavaScript runs, there is no component structure, and
every visual change is a hand edit against 504 unique utility classes.

This document specifies migrating that to Next.js **with no visible difference**.
"None" is the acceptance criterion, not "close enough": same URLs, same DOM, same
computed styles, same interaction behaviour. The user reviews the result in a browser
at each of 18 checkpoints and approves before the next one starts.

## Decisions

Six questions were settled before design. They are constraints, not preferences.

| # | Question | Decision |
|---|---|---|
| 1 | Rendering + deployment architecture | `output: 'export'` static export; data still fetched in-browser from the API |
| 2 | Tailwind strategy | Real `tailwindcss@3.4` build; transcribe the inline config verbatim |
| 3 | Language | TypeScript |
| 4 | `/admin/` in scope | No — stays static HTML |
| 5 | Approval cadence | One checkpoint per section (18), user approves each |
| 6 | Parity verification | User reviews in the browser; no automated pixel-diff tooling |

Q6 has a consequence worth stating up front: the pre-migration site must stay
runnable side by side for the whole project, or there is nothing to compare against.

## Verified facts

Everything in this section was confirmed by running a real Next.js 16.3.8 build and
by reading the live nginx config. None of it is assumed.

### Next.js static export: how route names become filenames

Test app at `/tmp/opencode/nexttest`, `output: 'export'`, `trailingSlash: false`.

| Route folder | Emitted | Served at | Verdict |
|---|---|---|---|
| `app/graphic-design.html/` | `out/graphic-design.html.html` | `/graphic-design.html.html` | **Rejected** |
| `app/graphic-design/` | `out/graphic-design.html` | `/graphic-design.html` | **Chosen** |

The `.html` route shape is unusable: Next appends `.html` to the full route path *and*
creates a payload directory at the same stem (`out/graphic-design.html/`), so the
rename needed to fix the double extension collides with that directory.

The clean-segment shape works because **nginx serves by file path, not by route
name.** The emitted document is literally named `graphic-design.html`, so
`https://chestlyace.online/graphic-design.html` resolves to it with no rewrite rule,
no redirect, and no canonical change.

Also confirmed:

- `public/` passes through verbatim (`public/x.html` → `out/x.html`).
- The RSC payload litter (`out/index.txt`, `out/<route>.txt`, `out/__next.*.txt`,
  `out/<route>/`) **can be deleted**. All three pages still hydrate, render, and log
  zero console errors with every payload file removed (verified via headless Chrome
  `--dump-dom`). This is safe *only* because internal navigation uses plain `<a>`
  tags, never `<Link>`.

### The live nginx config

Read from `ubuntu@13.49.191.50:/etc/nginx/sites-available/chestlyace` (80 lines).

| Line | Directive | Consequence for this migration |
|---|---|---|
| — | `root /var/www/chestlyace;` | unchanged |
| — | `index index.html;` | `out/index.html` serves `/` |
| — | `location / { try_files $uri $uri/ =404; }` | **no `$uri.html` fallback** — files must exist at exact paths |
| — | `location ~ /\.(?!well-known) { deny all; }` | `/_next/static/` is unaffected (no leading dot) |
| — | `location ^~ /backend/`, `/data/` → 404 | irrelevant; nothing new is published there |
| — | `location ~* \.(sql\|log\|bak\|env)$` → 404 | must not publish `.env` or `.sql` |
| — | `location ~* (\.bak\|\.old\|\.orig\|\.save\|~)$` → 404 | must not publish editor leftovers |
| — | `location /api/ { proxy_pass http://127.0.0.1:5000; }` | untouched |

**Zero nginx changes are required.** This was checked against the running config, not
assumed from the docs.

### Current site inventory

| Fact | Value |
|---|---|
| `index.html` | 919 lines, 504 unique utility classes, inline `tailwind.config`, 14-class `<style>` block, inline theme + section scripts |
| Subpages | ~158 lines each, bare `cdn.tailwindcss.com`, **zero** `dark:` variants, own `ld+json` |
| `js/app.js` | 540 lines, 194 class-carrying template literals |
| Live data | `{profile, skills: 29, services: 4, works: 25, journey: 9, socials: 4}` |
| `works` breakdown | 18 `design`, 7 `project`, **0 `event`** |

The absence of `event` works is **current behaviour, not a bug**: the EVENTS tab
renders empty in production today and must continue to.

### Environment findings

- `backend/.env` on the dev machine is **stale** — it still points at Neon
  (`*.neon.tech`, user `neondb_owner`, db `neondb`) while `AGENTS.md` documents a
  local Postgres on the EC2 host.
- A local Postgres listens on `:5432` but rejects `portfolio_user`.
- **Therefore a local API cannot serve, and the existing `API_URL` ternary is
  unusable for review.** Dev mode must read the live API. This is the only difference
  in the migration that changes what a running site *does* rather than how it is
  delivered, and it is dev-only and read-only.
- Node v24.19.0, npm 11.17.0. npm registry is slow: a `next` + `react` install took
  ~12 minutes.

## Parity contract

Three properties, all mechanically checkable:

1. **URL invariance.** `sitemap.xml`, canonicals, and every `href` are byte-identical
   before and after. `/`, `/graphic-design.html`, `/photography.html`,
   `/software-development.html`, `/admin/`, `/robots.txt`, `/resume.pdf`,
   `/hero-optimized.webp`, `/favicon.ico`, `/assets/…` all keep their current paths.
2. **Pre-fetch DOM invariance.** With the API unreachable, the served DOM equals
   today's served DOM.
3. **Post-fetch DOM invariance.** With the API reachable, the served DOM equals
   today's post-`app.js` DOM.

Properties 2 and 3 are achieved by the same mechanism: every section renders
`data ? <DataVersion/> : <PlaceholderVersion/>`, where the placeholder **is today's
literal HTML**, transcribed character for character.

## Design

### Target tree

```
app/
  layout.tsx                     <html>/<head>/<body>, all static meta, font links,
                                 hero preload, theme-init script, body classes, swirl overlay
  page.tsx                       assembles sections in today's exact DOM order
  globals.css                    @tailwind directives first, then the 14 custom classes verbatim
  graphic-design/page.tsx        -> out/graphic-design.html
  photography/page.tsx           -> out/photography.html
  software-development/page.tsx  -> out/software-development.html
components/
  site/      Navbar Footer FloatingActions ThemeToggle
  sections/  Hero About Skills Services Work Journey Contact Faq
  work/      WorkTabs ProjectCard DesignMasonry DesignLightbox EventCard
  ui/        MaterialIcon SocialIcon SectionBoundary
lib/
  types.ts        PortfolioData, Profile, Skill, Service, Work, JourneyItem, Social
  api.ts          API_URL resolution + the single fetch
  PortfolioProvider.tsx   client provider, one fetch, shared by every section
  cloudinary.ts   optimizeCloudinaryImage, ported line for line
public/
  favicon.ico  favicon-32x32.png  apple-touch-icon.png
  robots.txt   sitemap.xml
  hero-optimized.webp  684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png  resume.pdf
  logoNGcodeX.png  yibs.png  digimark.jpeg  ets_nhahealthtech_logo.jpeg
  assets/img  assets/og  assets/certs
tailwind.config.ts          transcribed verbatim from index.html's inline config
next.config.mjs             output: 'export', trailingSlash: false
postcss.config.mjs
scripts/
  finalize-export.mjs   NEW — asserts the 4 documents, deletes payload litter, greps for dangling refs
  check-assets.mjs      retargeted at out/
  deploy.sh             PUBLISH becomes out/ + admin/
```

`public/` maps to the site root 1:1, so every existing asset URL survives untouched.
Files pinned by database rows (`resume.pdf`, `684d5ff7-….png`) keep their bare root
filenames, and the four seed-fixture logos stay root-resolvable for `db/neon_setup.sql`.

### Routing rules

1. **Internal navigation uses plain `<a>` tags. Never `<Link>`.** Required for parity
   (`/#work` anchor scrolling must remain a real document navigation, not a
   client-side route change) and required for the payload-litter deletion to be safe.
2. The three subpage folders are named **without** a `.html` suffix; the extension
   comes from Next's export. See the verified-facts table above.
3. `sitemap.xml` and `robots.txt` are static files in `public/`, unchanged.
4. `/admin/` is not a route. It remains a copied static directory (see deploy).
5. **No `next/image`.** Every image stays a plain `<img>` carrying
   `loading="lazy"` and `decoding="async"`, exactly as `js/app.js` emits them today.
   `next/image` would inject a wrapper element, rewrite `src`/`srcset`, and require
   `images.unoptimized` — all visible DOM changes. There is no image optimization in
   this project.

### Tailwind

`tailwindcss@3.4` + `postcss` + `@tailwindcss/forms` + `@tailwindcss/typography`,
matching the CDN plugins (`?plugins=forms,typography`). The Play CDN is v3, so
utility semantics match class for class. `tailwind.config.ts` is a verbatim
transcription of the inline `tailwind.config` script, including
`darkMode: 'class'`, the custom colours (`background-light`, `background-dark`,
`primary`), `font-display`/`font-body`/`font-mono`, `borderRadius.sticker`, and the
`bg-swirl-pattern` `backgroundImage` data-URI — which contains single quotes and
`\'` escapes and must be transcribed byte for byte.

Tailwind v4 was rejected: its changed defaults would alter rendering.

### Cascade order

Today the CDN `<script>` precedes the `<style>` block, so custom CSS wins ties. In
`globals.css` the `@tailwind` directives must come **first** and the custom block
**second**, outside any `@layer`. A single `@layer` mistake inverts precedence and
produces a page that looks almost right — the hardest class of bug to spot by eye.

The 14 selectors transcribed verbatim: `bg-swirl` (+ its `.dark` variant),
`defer-section`, `glass`, `glass-card`, `glass-light`, `glass-panel`, `lightbox-open`,
`masonry-gallery`, `masonry-item`, `sr-only`, `sticker`, `text-outline`,
`timeline-line`.

### The seven classes that must stay no-ops

`bg-grid-pattern` (4 uses), `light-glass-panel` (1), `card-hover` (2),
`glass-border` (2), `surface-dark` (3), `shadow-glow` (1), `ml--10` (1).

**Nothing defines these.** They are inert today. They are copied verbatim into JSX
and **must never be given a definition.** Defining them — the obvious "cleanup" a
migration invites — changes the appearance of at least four elements and is exactly
the kind of unrequested change this project forbids. `bg-swirl-pattern` is the
opposite case: it is real, from the config, and must keep working.

`ml--10` deserves its own note. It appears once, on the work-section header
(`index.html:493`), and is a **misspelling** — the intended class was `-ml-10`. It is
not a valid Tailwind utility, so it generates nothing and applies nothing. It must be
transcribed exactly as `ml--10`. "Repairing" it to `-ml-10` shifts the work header
left by 2.5rem, which is precisely the sort of invisible-until-you-look change this
project forbids.

### Data layer

One `fetch` of the portfolio payload, shared through `PortfolioProvider`, replacing
today's six render functions called in sequence from one `try/catch`.

`API_URL` resolution changes from a bare hostname ternary to an env-configurable
value with these tiers:

| Environment | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` set | that value |
| `localhost` / `127.0.0.1` | `https://chestlyace.online/api` (live, read-only) |
| anything else (production) | `/api` (same-origin, proxied by nginx) |

Production behaviour is unchanged. The localhost tier changed because a local API
cannot run (§ environment findings). The public frontend has no write path, so
reading the live API cannot mutate anything.

### Error containment

Today a thrown selector is swallowed by `fetchPortfolioData`'s `try/catch`, so later
sections simply keep their placeholder markup. In React an uncaught throw unmounts
the tree and yields a white screen — a strictly worse failure mode and a misleading
one, since `AGENTS.md` documents that a renamed selector already *looks* like "the API
is down" when it is really a `null.textContent` error.

Sections therefore never throw on absent data, and **each section is wrapped in its own
error boundary** that falls back to that section's placeholder markup. A root-level
`app/error.tsx` is *not* sufficient and is not used for this: it would replace the
whole page, which is the opposite of the current behaviour. This preserves the
existing failure mode instead of hardening past it.

### Client boundary and hydration

Every homepage section is a Client Component, because they all consume the shared
portfolio provider. That is deliberate, not laziness: the current site renders its
placeholder HTML, then rewrites it from fetched data, and a fully client-rendered
section reproduces that exactly. It also forfeits React Server Component streaming,
which this project has no use for.

Hydration safety follows from that structure and must not be broken:

- The server renders the placeholder, because the provider has no data yet.
- The first client render must also be the placeholder. React therefore hydrates a
  matching tree and there is no mismatch.
- **Consequence:** theme state must not be initialised from `localStorage` during
  render. Doing so makes the server HTML (`light`) differ from the first client render
  (`dark`), React discards the server markup, and the theme-init script's DOM change
  is thrown away — reintroducing exactly the FOUC that script exists to prevent. The
  theme-init script owns `<html class="dark">`; React owns nothing about it.

### Retiring the old files

`index.html`, `js/app.js`, and the three subpage HTML files are deleted only at
checkpoint 18, after the new site is approved. Until then they are the migration
source of truth *and* the review baseline, and the baseline worktree on `main` keeps
them runnable permanently. Nothing is deleted mid-project.

### Section switching

Today's `showSection()` is an inline `onclick` that imperatively toggles `.hidden` and
swaps five classes per button. It becomes `useState<'projects'|'design'|'events'>`,
reproducing these details exactly:

- Initial state. `#projects-section` has **no** `hidden`;
  `#design-section` and `#events-section` **do**. `#design-section` is
  `w-full section-content hidden` and wraps `.masonry-gallery`; `#events-section` is
  `grid grid-cols-1 md:grid-cols-2 gap-8 w-full section-content hidden`.
- `showSection()` never touches the transition utility. `#btn-projects` keeps
  `transition-all` and the other two keep `transition-colors` **regardless of which
  button is active**. Only five classes move: active gains `bg-black text-white
  dark:bg-white dark:text-black shadow-lg`, inactive gains `text-gray-600
  dark:text-gray-300 hover:text-black dark:hover:text-white`.
  A `useState` implementation that rebuilds the whole `className` per state will get
  this wrong on the first click.

### Theme initialisation

Today an inline script at the end of `<body>` reads `localStorage.theme` (falling back
to `prefers-color-scheme`) and toggles `dark` on `document.documentElement` **before
first paint**.

In Next this must be a `<script>` in the layout's `<head>`. **Not** `useEffect`, which
runs after paint and produces a white flash on every dark-mode reload. This is the
single most likely visible regression in the whole migration.

The toggle handler keeps the same `localStorage.theme` key and the same `'dark'` /
`'light'` values. `<html>` is manipulated directly, not via a `next-themes` hook.

### SEO

`updateSeo()` runs in the browser and mutates `document.title`, ~11 meta tags, the
canonical, and `#structured-data`. Its behaviour must be preserved verbatim,
including the two non-obvious bits:

- `roleText` = `[title_1, title_2, title_3].join(', ').replace(/,([^,]*)$/, ' &$1')`
  → `Software Developer, Graphic Designer & Photographer`.
- `.hero-title-3` is set to `` `& ${profile.title_3}` `` → renders `& PHOTOGRAPHER`.

Next's Metadata API is **not** adopted for the dynamic tags: it would server-render
them, which changes the HTML a crawler reads. Static tags (OG, Twitter, favicons,
font links) do go in the layout JSX. Next auto-injects `charSet` and `viewport`, so
the emitted `<head>` is diffed against today's at the layout checkpoint.

### Other details that will bite

- `.about-text-1` drop cap: JS replaces innerHTML with
  `` `<span class="float-left text-7xl font-display leading-none mr-4 mt-2 text-black dark:text-white">${about_text_1.charAt(0)}</span>${about_text_1.slice(1)}` ``.
- Lightbox: Escape, ArrowLeft/Right, `touchstart`/`touchend` with a 48px threshold,
  and `body.lightbox-open`.
- `.defer-section { content-visibility: auto }` on 7 elements — affects scroll and
  screenshot timing, so it must be present before any visual comparison is meaningful.
- `.profile-name` is a NodeList (navbar **and** footer); `.hero-title-1/-2/-3` are
  single elements. Getting this backwards silently updates one instance.
- `optimizeCloudinaryImage()` rewrites only URLs containing `/image/upload/`. Bare
  local paths (`resume.pdf`, `digimark.jpeg`) pass through untouched.
- Font and icon assets load from third-party CDNs, in this exact `<head>` order:
  four preconnects (`fonts.googleapis.com`, `fonts.gstatic.com`,
  `cdnjs.cloudflare.com`, `cdn.jsdelivr.net`), the hero `<link rel="preload"
  as="image">` with its `imagesrcset`/`imagesizes`, one `css2` stylesheet for
  **Bebas Neue, Inter, Outfit**, then Material Icons Outlined, FontAwesome 6.4.0, then
  Material Icons Round. FontAwesome and Material Icons are **not** bundled or
  self-hosted — self-hosting would change what renders.
- `.material-icons-outlined` and `.fab` are ligature/icon-font classes, not icon
  components. They render as `<span class="material-icons-outlined">dark_mode</span>`
  and `<i class="fab fa-whatsapp">`. Replacing them with a React icon library would
  change rendering and is out of scope.

Two pre-existing quirks are **deliberately not fixed**, because fixing them is a
behaviour change nobody asked for:

- `window.open(url, '_blank').focus()` throws when the popup is blocked.
- `alert()` fires when the contact form is submitted empty.

### Subpages

Migrated to real routes so one CSS pipeline and one component library serve the whole
site. They share `app/layout.tsx` for `<html>`/`<body>` and the font/favicon setup,
but they do **not** use the custom theme colours, `darkMode`, or any `prose` class —
they use only stock palette utilities, so inheriting the global config changes nothing
about how they render.

### Build scripts

`scripts/finalize-export.mjs` (new), run after `next build`:

1. Assert `out/index.html`, `out/graphic-design.html`, `out/photography.html`,
   `out/software-development.html` all exist.
2. Delete the RSC payload litter (`out/*.txt`, `out/__next.*.txt`, `out/<route>/`).
3. Grep the remaining output for references to any deleted path; **hard-fail** if one
   is found.

Step 3 is what makes step 2 safe to run automatically rather than on trust.

`scripts/check-assets.mjs` is retargeted at `out/` instead of the five HTML sources,
which no longer exist as HTML. This is strictly stronger than today — it audits what
actually ships rather than what was committed — and it additionally asserts that every
`<loc>` in `sitemap.xml` resolves to a real file in `out/`. `PINNED_BY_DATA` keeps its
two entries, now checked against `public/`.

`package.json` build becomes
`next build && node scripts/finalize-export.mjs && node scripts/check-assets.mjs`.
`npm run dev` becomes `next dev`; `npm test` still exits 1 by design.

### Deployment

`scripts/deploy.sh` `PUBLISH` becomes `out` and `admin`. Four changes:

1. **Staging semantics.** `out/` contributes its *contents* to the docroot root, not a
   nested `out/` directory:

   ```bash
   for p in "${PUBLISH[@]}"; do
     if [ "$p" = "out" ]; then
       cp -a "$REPO_ROOT/out/." "$STAGE/"   # contents -> docroot root
     else
       cp -a "$REPO_ROOT/$p" "$STAGE/"
     fi
   done
   ```

   Without the special case the site would be published at `/out/index.html` and every
   URL would 404.
2. **Guard 3** greps `$REPO_ROOT/out` and `$REPO_ROOT/admin` instead of
   `$REPO_ROOT/js`, `$REPO_ROOT/admin`, `$REPO_ROOT/index.html`.
3. **Guards 1, 2, 4** are unchanged in shape. Guard 2 must not match the new path
   names (`out`, `admin`).
4. `rsync --delete` therefore reduces the docroot to exactly `out/*` + `admin/`. The
   now-obsolete `js/` directory is removed from the docroot, which is correct — it is
   no longer published. `_next/` is added. Every other published path is unchanged.

`admin/` keeps its `noindex, nofollow` meta and the `robots.txt` `Disallow: /admin/`
line, both untouched.

`.gitignore` gains `out/` and `.next/`.

### Review workflow

`main` stays runnable for the whole project:

```
git worktree add ../portfolio-baseline main     # pre-migration site, served on :3000
npm run dev -- --port 3001                      # new Next site
```

Both tabs read the same live API, so any visual difference is attributable to the
migration and nothing else.

## Intentional differences

The complete list. **Everything else must be zero-difference.**

1. On `localhost`, dev reads the live API instead of `localhost:5000`. Forced by the
   stale Neon `.env` and the absent local database. Read-only, dev-only; production
   still uses `/api`.
2. The `js/app.js?v=20261001-restructure` cache-bust query is gone; Next fingerprints
   assets instead. Not observable.
3. CSS arrives via `<link>` rather than being injected at runtime by the CDN.
4. `check-assets.mjs` audits build output instead of HTML sources, and additionally
   verifies `sitemap.xml` targets resolve.

## Checkpoints

Eighteen. Each ends with the user reviewing on `:3001` against the baseline on `:3000`
and approving before the next begins.

**Pre-flight, before checkpoint 1:** reset `feature/nextjs-migration` onto `main` and
create the baseline worktree.

```bash
git checkout feature/nextjs-migration
git reset --hard main                      # it is 17 commits stale
git worktree add ../portfolio-baseline main
```

| # | Checkpoint | # | Checkpoint |
|---|---|---|---|
| 1 | Scaffolding: Next 16 + TS + Tailwind 3.4 + config + `globals.css` + export + `finalize-export` | 10 | Design masonry |
| 2 | `layout.tsx`: head, static meta, fonts, preload, theme-init script, body classes; diff `<head>` against today | 11 | Events grid |
| 3 | Navbar | 12 | Design lightbox |
| 4 | Hero | 13 | Journey timeline |
| 5 | About shell + arsenal + soft-skill pills | 14 | Contact left column |
| 6 | Skills grids | 15 | Contact form |
| 7 | Services | 16 | FAQ |
| 8 | Work header + category tabs | 17 | Footer + floating actions |
| 9 | Projects grid | 18 | SEO updater → subpages ×3 → scripts, deploy, docs, delete old files |

Checkpoint 18 is bundled because each piece is small and individually unverifiable
without a full build.

## Explicitly out of scope

- `/admin/` — stays static HTML (Q4).
- The backend, the database, Cloudinary configuration, and the stale `backend/.env`.
- SEO improvements, SSR, image optimization, caching, prefetching.
- Any visual or UX change, however small.
- "Fixing" the seven no-op classes — they are preserved as no-ops on purpose.
- nginx, systemd, pm2, TLS.
- A real test framework. `npm test` still exits 1 by design.

## Risks

| Risk | Mitigation |
|---|---|
| White flash on dark-mode reload | Theme-init script in `<head>`, never `useEffect`; theme never read from `localStorage` during render; checked at checkpoint 2 |
| A utility class silently dropped in a template-literal → JSX rewrite | Class-by-class transcription; seven no-op classes called out explicitly |
| Custom CSS losing the cascade tie | `@tailwind` first, custom block second, no `@layer` |
| `useState` rewriting button classes wholesale | Five moving classes specified in § section switching |
| A section throw blanking the page | Per-section `SectionBoundary` falls back to that section's placeholder |
| Deploy publishing to `/out/` | Staging copies `out/.` to the docroot root; guard in checkpoint 18 |
| Payload deletion breaking hydration | Verified empirically; `finalize-export.mjs` greps for dangling refs |
