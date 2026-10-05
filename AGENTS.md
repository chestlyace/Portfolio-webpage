# AGENTS.md

## What this is

Next.js 16 static export (`output: 'export'`, so the build writes a complete site into `out/`)
with a separate Express API (`backend/server.js`) backed by **PostgreSQL** + **Cloudinary**. A
password-gated admin panel (`admin/`) writes to the same DB; the public site reads it at runtime
from the browser.

`admin/` is **not** migrated. It is still hand-written static HTML and JS, served as-is, and it
deliberately survives a build failure.

> **Pending retirement.** The pre-migration sources — `index.html`, `graphic-design.html`,
> `photography.html`, `software-development.html`, `js/app.js` — are still tracked. The app
> router never reads them; they exist only as the transcriptions' reference until the migrated
> site is approved and they are deleted. `scripts/check-assets.mjs` reads `out/`, not them, so
> they are already outside the deploy.

## Deployment reality (not guessable from the repo)

- nginx on an EC2 host serves the document root `/var/www/chestlyace` and proxies
  `/api/` to a Node process on `127.0.0.1:5000`.
- **The API does not run from this repo.** It runs from a separate clone on the
  host, started as a bare `node server.js` with no systemd unit and no pm2, so it
  will not survive a reboot. Backend changes need their own deploy step and a
  manual restart.
- The document root was historically a hand-copied snapshot of the repo root,
  which is how `backend/.env` was served publicly. It is now an explicit
  allowlist of `out` and `admin`: `./scripts/deploy.sh` (dry run) / `--apply`
  to publish. **`npm run build` must run first** — the script publishes `out/`,
  so deploying without rebuilding ships whatever the last build produced.
- Because the unit of trust is now a directory rather than a set of entries, the
  "nothing else can be published by accident" guarantee rests on the two guards
  in `deploy.sh` that scan the published trees for unsafe file names and
  credential-shaped content. `next build` copies all of `public/` into `out/`
  verbatim, dotfiles included — **keep secrets out of `public/`.**
- `README.md` is accurate — use it for the layout table and the deploy commands.
- `.agent/workflows/deploy-netlify.md` is obsolete: its frontmatter says "Deploy
  backend to Netlify with MongoDB" and it provisions a MongoDB Atlas cluster.
- **The database is local to that same host.** `DATABASE_URL` resolves to
  `127.0.0.1:5432`, database `portfolio_db`, user `portfolio_user` — a plain
  PostgreSQL instance on the EC2 box, not a managed one. There is no managed
  database and no copy of its credentials outside this host, so `DATABASE_URL`
  lives in the gitignored `backend/.env` and database work means SSH access to
  the EC2 host.

## Never move these

Everything published comes from `public/` (copied verbatim into `out/` by the
build) plus `admin/`. So the rule is simply: **a new static file goes in
`public/`, and nothing needs to be added to `PUBLISH`** — the allowlist names two
directories, both of which are copied whole.

- **The four pages' URLs.** `public/sitemap.xml` publishes them at the domain root
  and every cross-page link is root-absolute (`/graphic-design.html`, `/#work`).
  `scripts/check-assets.mjs` now asserts every `<loc>` maps to a file in `out/`,
  so dropping or renaming an exported page fails the build.
- **`favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png`, `sitemap.xml`,
  `resume.pdf`, `hero-optimized.webp`, `684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png`** —
  all in `public/`, all referenced root-absolute by the pages or the database.
- **`public/robots.txt`** — referenced by nothing in the repo. It stays because
  crawlers request `/robots.txt` by convention, and its `Disallow: /admin/`
  reinforces the `noindex, nofollow` meta at `admin/index.html:8`. Deleting it
  would drop one of the two signals keeping `/admin/` out of search indexes.
- **`public/resume.pdf`** — database row `profile.resume_url`. The client writes
  the row value over the `href` at runtime, so the row is the authority; moving the
  file 404s the resume button.
- **`public/684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png`** — database row
  `profile.hero_image`, referenced by nothing else at all, so
  `scripts/check-assets.mjs` asserts it precisely because nothing else would.
- **`public/logoNGcodeX.png`, `public/yibs.png`, `public/digimark.jpeg`,
  `public/ets_nhahealthtech_logo.jpeg`** — look unreferenced, but
  `db/neon_setup.sql` seeds `journey.logo_url` with those bare filenames. See the
  Database section for the full reason. The absence of references is not licence to
  move them.

Two leftovers, safe to delete but deliberately not deleted silently:

- **Byte-identical copies at the repo root** of `resume.pdf`,
  `684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png`, `favicon.ico`, `favicon-32x32.png`,
  `apple-touch-icon.png`, `hero-optimized.webp`, `sitemap.xml`, `robots.txt` and the
  four seed-fixture logos. They are tracked and unreferenced by the app; only the
  `public/` copies are published. `check-assets.mjs` asserts the two
  data-pinned files in `public/`, not at the root.
- **`assets/` at the root** — a byte-identical duplicate of `public/assets/`
  (21 files). Unreferenced, unpublished, dead weight in the repo.

## Commands

```bash
npm run dev                          # Next dev server -> http://localhost:3001
                                     # (port hardcoded in package.json)
npm run build                        # next build -> out/, then finalize-export.mjs,
                                     # then check-assets.mjs. Run this before every
                                     # deploy; deploy.sh publishes out/.
node scripts/check-assets.mjs        # standalone asset integrity gate
./scripts/deploy.sh                  # dry run
./scripts/deploy.sh --apply          # publish
cd backend && npm start              # API -> 5000, only works on the EC2 host
```

No tests, lint, formatter, or typecheck. `npm test` exits 1 by design. There are
no tests because the site has no runtime behaviour of its own to assert beyond
what the checker and the browser cover; integrity is enforced by
`scripts/check-assets.mjs` at the end of every build.

Ports: dev 3001, API 5000.

## API URL

`lib/api.ts` resolves it in order: `NEXT_PUBLIC_API_URL`, else on
`localhost`/`127.0.0.1` the **live** origin `https://chestlyace.online/api`,
else `/api` (nginx proxies that to `127.0.0.1:5000`).

**There is no runnable local API.** `backend/.env` on this machine points at a
dead Neon host and the local Postgres rejects `portfolio_user`, so the localhost
branch deliberately reads production. It is read-only. Do not point dev at a LAN
IP or a preview domain — that also hits the live database.

`admin/admin.js` is not migrated and keeps its own hostname ternary, so changing
the backend host means editing `lib/api.ts` **and** `admin/admin.js`.

## Env vars

`dotenv` loads from cwd, so the env file is **`backend/.env`** (gitignored):
`DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`JWT_SECRET`, `ADMIN_PASSWORD`, `PORT`.

`backend/.env.example` exists but is **stale**: it is Supabase-era and still lists
`SUPABASE_URL` and `SUPABASE_ANON_KEY`, which nothing reads any more, and omits
`DATABASE_URL`, which is the one var that matters. Do not copy it as-is.

## Database

- `db/neon_setup.sql` is the schema **and** seed source of truth (181 lines, `DROP TABLE IF EXISTS` on all 6 tables + 10 `INSERT`s). Re-running it **destroys data**.
- The Supabase-era files (`supabase_setup.sql`, `supabase_update.sql`, `initial_data.sql`) were deleted; their `ALTER TABLE` changes are already folded into `db/neon_setup.sql`.
- Tables: `profile` (single row, `id = 1` hardcoded in `PUT /api/profile`), `skills`, `services`, `works`, `journey` (ordered by `order_index`), `socials`.
- JSONB columns: `services.items`, `works.tech_stack`, `works.highlights`. The backend parses incoming FormData JSON strings then re-stringifies them for `pg`.

`logoNGcodeX.png`, `yibs.png`, `digimark.jpeg`, and `ets_nhahealthtech_logo.jpeg`
have no HTML reference and are absent from the live database, but `db/neon_setup.sql`
seeds `journey.logo_url` with those bare filenames. Keep them so a fresh seed does
not 404.

### Write endpoints are asymmetric — know what the admin can't edit

| Resource | Endpoints |
|---|---|
| works | POST/PUT/DELETE |
| journey | POST/PUT/DELETE |
| skills | POST + DELETE only — **no PUT, so names/icons are not editable via admin** |
| profile | PUT only (whole-row) |
| services, socials | **no write endpoints at all — SQL only** |

Editing services/socials/skill labels requires running SQL against the local Postgres directly.

## Auth model

One shared `ADMIN_PASSWORD` compared with `===` (no user table; `bcryptjs` is imported but never used). `POST /api/login` returns a 24h JWT, stored in `localStorage.adminToken` and sent as `Authorization: Bearer`. Password rotation invalidates nothing until token expiry.

## Dynamic SQL is built from request bodies

`buildUpdateQuery` / `buildInsertQuery` (`backend/server.js:117-138`) turn `Object.keys(req.body)` into quoted column names. Unexpected keys in a payload become bogus columns and 500. `id` is explicitly deleted before inserts — don't send it expecting it to be honored.

## Data flows through one provider, not a DOM sweep

`lib/PortfolioProvider.tsx` fetches `/api/portfolio` **in the browser** and every section reads
it with `usePortfolio()`. There is no server component and no build-time fetch, deliberately:
the pre-migration site rendered its placeholders and then filled them in, so "API down → the page
still renders" had to be preserved. That is why the export ships a `useEffect` fetch and why
`app/(home)/page.tsx` renders the full page with no data at all.

Consequences worth knowing:

- **Nothing in the export contains real content.** Every dynamic string is absent from `out/`
  until the client fetch resolves. SEO meta tags in the markup are placeholders for crawlers
  that skip JS; the real values are written by `lib/seo.ts` at runtime.
- A component that maps over data needs a real fallback branch. Several sections render
  placeholder children (empty `<article>` shells, the "No projects yet" copy) so the layout does
  not collapse before the fetch lands.
- A **transcribed container is not a migrated renderer.** If you port a `<div id="…">` from the
  old markup, check whether the old `js/app.js` actually wrote to it. Several containers were
  only ever static.

## Sections are toggled, not stacked

`.section-content` elements ship with `hidden`; the three work tab buttons in
`components/work/WorkTabs.tsx` reveal one at a time. A section can look "empty" simply because
it is not the active one. `category-btn` and `section-content` have **no CSS definition anywhere** —
they are hook classes. They exist in the DOM because `showSection` selects on them, so do not
"clean them up".

## Uploads

Cloudinary via `multer`; the **multer field name selects the folder and transform**:

| field | used by | behavior |
|---|---|---|
| `logo` | journey | `portfolio/journey`, 600×600 |
| `image` | works | `portfolio/works`, 1600×1600 |
| `file` | profile hero/resume | `portfolio/profile`, 1600×1600 |

Images are forced to `webp` by Cloudinary; PDFs pass through as `raw`/`pdf`. 10 MB limit, enforced
by the error middleware at the end of `server.js`. `optimizeCloudinaryImage()` in
`lib/cloudinary.ts` only rewrites URLs containing `/image/upload/` — legacy local paths
(`resume.pdf`, `digimark.jpeg`) are passed through untouched.

**Journey logos are `c_limit`, not `c_scale`.** `lib/cloudinary.ts` uses
`120×120, crop: 'limit'` for them. Omitting `crop` makes Cloudinary fall back to
`c_scale`, which stretches a non-square logo — that bug shipped 2 of 9 journey logos at
38×38 instead of 38×21.5.

## Admin form quirks (`admin/admin.js`)

- The work form is type-dependent (`updateWorkFormVisibility`): one comma-separated input
  (`tech_stack_input`) is written to `tech_stack` for `project` and to `highlights` for `event`;
  `design` hides both plus the live-URL fields.
- Unchecked checkboxes are absent from `FormData`, so `is_live_url_private` / `is_source_url_private`
  are set explicitly from `.checked`. The backend also coerces them with `=== 'true'`, which means
  a real JSON boolean body would be misread — always send these as FormData.
- The work submit handler is registered once against `work-form`, so add/edit must keep sharing
  that one form element.

## SEO is generated at runtime

`lib/seo.ts` (`applySeo`, called from `components/site/SeoUpdater.tsx` in an effect) rewrites the
meta tags and the `#structured-data` `application/ld+json` block. FAQ entities are scraped from
`#faq details > summary/p`, so the FAQ markup is the input to `FAQPage` — and `summary.textContent`
is `.trim()`ed, which is why the whitespace before `<span>add</span>` in `components/sections/Faq.tsx`
is a string expression (`{'\n          '}`) rather than a bare `{' '}`. Getting that wrong changes
the published `name` value. The canonical URL is hardcoded to `https://chestlyace.online/`. Tags in
the exported HTML are placeholders for crawlers that skip JS.

## Seven classes that look like typos and are not

`bg-grid-pattern`, `light-glass-panel`, `card-hover`, `glass-border`, `surface-dark`,
`shadow-glow`, and `ml--10` are used in the markup and **defined nowhere** — not in
`tailwind.config.ts`, not in `app/globals.css`. They were undefined in the pre-migration site too.
They are load-bearing for pixel parity, so they are transcribed verbatim and must not be
"fixed". Near misses: `bg-swirl-pattern` *is* real (`backgroundImage['swirl-pattern']`),
`glass-panel` *is* real (in `app/globals.css`), and `card-dark` *is* real
(`theme.extend.colors`).

## The three subpages are separate static routes

`graphic-design`, `photography` and `software-development` are App Router routes with their own
root layouts (`app/<route>/layout.tsx`), each holding that page's `<head>` verbatim. They load no
data and no client component. Each exports its own `application/ld+json` via
`dangerouslySetInnerHTML`.

**They keep `<script src="https://cdn.tailwindcss.com">` and do not import `app/globals.css`.**
The sources had no stylesheet link and no font preconnects, and the CDN now resolves to Tailwind
**v4** while the home build is v3.4 — importing the home CSS would add a `<link>` the source
never had and swap the preflight. The subpages use no custom theme keys, so the v4 preflight
styles them correctly anyway. **Consequence to expect: the subpages still log
`cdn.tailwindcss.com should not be used in production`, exactly as the baseline does.**

**Do not add `export const metadata` to a subpage.** Next would emit a second `<title>` and a
second viewport tag alongside the literal ones already in the layout.

## Parity rules — do not "improve" these

The migration's brief was **zero difference**: same URLs, same DOM, same computed styles, same
interaction behaviour. Added functionality is also a failure. These decisions look like
oversights and are not:

- **Plain `<img>`, never `next/image`.** No `srcset`, no lazy-loading wrapper, no blur
  placeholder — the source had none.
- **Plain `<a href>`, never `next/link`.** This is also why the two-root-layout full-page-load
  caveat never applies.
- **No `next/font`.** The Google Fonts links in the head are transcribed as written.
- **No `export const metadata` anywhere.** All meta tags are literal markup in a layout, because
  they are rewritten at runtime by `lib/seo.ts`.
- **No icon or social components.** Icons are raw `<i class="material-icons">` ligature names,
  because a component would change the emitted class string.
- **Never read the theme from `localStorage` during render.** The theme is a head `<script>`;
  reading storage in a component causes a hydration mismatch.
- **The theme never flips after first paint.** Tailwind v3.4 with `darkMode: 'class'` has no
  FOUC-free CSS-only answer, so the flip is visible on reload exactly as it was before.
- **Per-section `components/ui/SectionBoundary.tsx`, not a root `app/error.tsx`.** A root boundary
  would replace the whole page on one failed fetch; the old `try/catch` replaced one section.

### Three pre-existing production bugs are reproduced on purpose

Do not fix these; they are the baseline the migration was measured against.

1. 3 of 29 skill icons store Tailwind utility strings instead of material-icon ligature names
   (ids 21, 23, 24), so those render as empty `<i>`.
2. The live `about_text_1` differs from the static markup, so the About paragraph changes on load.
3. The navbar hamburger button is inert — it has no click handler.

**One accepted difference in the same area:** `Contact.tsx` binds
`href={`mailto:${email}`}` directly, so before the fetch resolves the `href` is
`mailto:undefined` and the visible text falls back to `developerace0@gmail.com`. The legacy
page instead shipped a stale `mailto:chestlyace@gmail.com` that `js/app.js:298-299` rewrote
page-wide once the profile arrived. Both converge on `profile.email` after the fetch, so only
the pre-API paint differs.

## Git

Default branch is `main`; commits are Conventional Commits (`feat:`, `fix:`, `chore:`, `style:`).
`feature/nextjs-migration` carries the Next.js migration and is **ahead of `main`**;
`git rev-list --count main..feature/nextjs-migration` gives the current count.

`.gitignore` contains `node_modules`, `.env`, `.superpowers/`, plus `out/`, `.next/`, and
`next-env.d.ts` — none of the build output is tracked, so `out/` must be rebuilt before
every deploy. Bulk imagery lives in `public/assets/`; **a new static file goes in
`public/`** and needs no `PUBLISH` entry.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
