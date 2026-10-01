# AGENTS.md

## What this is

Static Tailwind-via-CDN portfolio (`index.html` + 3 subpages) with a separate Express API
(`backend/server.js`) backed by **Neon Postgres** + **Cloudinary**. A password-gated admin
panel (`admin/`) writes to the same DB; the public site reads it at runtime.

## Deployment reality (not guessable from the repo)

- nginx on an EC2 host serves the document root `/var/www/chestlyace` and proxies
  `/api/` to a Node process on `127.0.0.1:5000`.
- **The API does not run from this repo.** It runs from a separate clone on the
  host, started as a bare `node server.js` with no systemd unit and no pm2, so it
  will not survive a reboot. Backend changes need their own deploy step and a
  manual restart.
- The document root was historically a hand-copied snapshot of the repo root,
  which is how `backend/.env` was served publicly. It is now an explicit
  allowlist: `./scripts/deploy.sh` (dry run) / `--apply` to publish.
- `README.md` is accurate — use it for the layout table and the deploy commands.
- `.agent/workflows/deploy-netlify.md` is obsolete: its frontmatter says "Deploy
  backend to Netlify with MongoDB" and it provisions a MongoDB Atlas cluster.
  The stack is Neon Postgres on an EC2 host.

## Never move these

- **The four HTML pages.** `sitemap.xml` publishes them at the domain root and
  every cross-page link is root-absolute (`/graphic-design.html`, `/#work`).
- **`favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png`, `sitemap.xml`** —
  referenced root-absolute by the pages.
- **`robots.txt`** — referenced by nothing in the repo. It stays because crawlers
  request `/robots.txt` by convention, and its `Disallow: /admin/` reinforces the
  `noindex, nofollow` meta at `admin/index.html:8`. Deleting it would drop one of the
  two signals keeping `/admin/` out of search indexes.
- **`hero-optimized.webp`** — root-absolute `og:image` and the `js/app.js` fallback.
- **`resume.pdf`** — Neon row `profile.resume_url`, which `js/app.js` writes over
  the `href="resume.pdf"` fallback in `index.html` at runtime. The row is the
  authority; moving the file 404s the resume button.
- **`684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png`** — Neon row `profile.hero_image`
  and referenced by nothing else at all, so `node scripts/check-assets.mjs` asserts
  it precisely because nothing else would.
- **`logoNGcodeX.png`, `yibs.png`, `digimark.jpeg`, `ets_nhahealthtech_logo.jpeg`** —
  look unreferenced, but `db/neon_setup.sql` seeds `journey.logo_url` with those
  bare filenames. See the Database section for the full reason. The absence of
  references is not licence to move them.

A new **root-level** page or asset means adding it to `PUBLISH` in `scripts/deploy.sh`.
The allowlisted directories (`js`, `admin`, `assets`) are copied whole, so new files
inside them need no entry.

## Commands

```bash
npm run dev                          # static site -> http://localhost:3000
cd backend && npm start              # API -> http://localhost:5000 (no watch)
node scripts/check-assets.mjs        # must pass before deploying
./scripts/deploy.sh                  # dry run
./scripts/deploy.sh --apply          # publish
```

No tests, lint, formatter, or typecheck. `npm test` exits 1 by design. There are
no tests because the site has no build step; asset integrity is checked by
`scripts/check-assets.mjs` and deployment by HTTP status checks.

Ports: `serve` 3000, Live Server 5501, API 5000.

## API URL

`js/app.js` and `admin/admin.js` each define `API_URL` as a hostname ternary:
`localhost`/`127.0.0.1` → `http://localhost:5000/api`, everything else → `/api`.
There is no env or config mechanism, so changing the backend host means editing
**both** files. Any non-localhost hostname therefore hits the live site and the
live database — never test on a LAN IP, preview domain, or tunnel.

## Env vars

`dotenv` loads from cwd, so the env file is **`backend/.env`** (gitignored; no `.env.example` exists):
`DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`JWT_SECRET`, `ADMIN_PASSWORD`, `PORT`.

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

Editing services/socials/skill labels requires running SQL against Neon directly.

## Auth model

One shared `ADMIN_PASSWORD` compared with `===` (no user table; `bcryptjs` is imported but never used). `POST /api/login` returns a 24h JWT, stored in `localStorage.adminToken` and sent as `Authorization: Bearer`. Password rotation invalidates nothing until token expiry.

## Dynamic SQL is built from request bodies

`buildUpdateQuery` / `buildInsertQuery` (`backend/server.js:117-138`) turn `Object.keys(req.body)` into quoted column names. Unexpected keys in a payload become bogus columns and 500. `id` is explicitly deleted before inserts — don't send it expecting it to be honored.

## Content is DB-driven — hand-edits to dynamic sections are discarded

On every load, `js/app.js` **wipes and re-renders** these containers:
`#services .grid`, `#projects-section`, `#design-section .masonry-gallery`, `#events-section`,
all `.timeline-line` sibling items, and the three social grids. Anything you write inside them
in HTML is thrown away. Genuinely static content (FAQ, certs, hero fallback, SEO copy) lives in
`index.html`.

### Brittle selectors — renaming these classes silently breaks the page

`renderProfile`/`renderSkills`/`renderSocials`/`renderJourney` query by literal class strings
and throw on a miss. The throw is swallowed by the `try/catch` in `fetchPortfolioData`, so a
renamed selector looks like "the API is down" while it is actually a `null.textContent` error:

- profile: `.profile-name`, `.hero-title-1/-2/-3`, `.hero-tagline`, `.hero-image`, `.about-quote`, `.about-text-1/-2`, `.resume-link`, `.contact-email`, `.contact-phone`
- socials: `.flex.gap-3.text-xl`, `#contact .grid.grid-cols-4.gap-4`, `footer .flex.space-x-4`
- skills: `.skills-languages`, `.skills-frameworks`, `.skills-tools`
- journey: `.timeline-line` (its parent is the insertion target)

Check the browser console before blaming the backend.

### Sections are toggled, not stacked

`.section-content` elements ship with `hidden`; an inline `showSection(id)` in `index.html` reveals
one at a time. A section can look "empty" simply because it is not the active one.

## Uploads

Cloudinary via `multer`; the **multer field name selects the folder and transform**:

| field | used by | behavior |
|---|---|---|
| `logo` | journey | `portfolio/journey`, 600×600 |
| `image` | works | `portfolio/works`, 1600×1600 |
| `file` | profile hero/resume | `portfolio/profile`, 1600×1600 |

Images are forced to `webp` by Cloudinary; PDFs pass through as `raw`/`pdf`. 10 MB limit, enforced
by the error middleware at the end of `server.js`. `optimizeCloudinaryImage()` in `js/app.js`
only rewrites URLs containing `/image/upload/` — legacy local paths (`resume.pdf`,
`digimark.jpeg`) are passed through untouched.

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

`index.html` `#structured-data` (`application/ld+json`) is overwritten by `updateSeo()`. FAQ
entities are scraped from `#faq details > summary/p`, so FAQ markup is the input to `FAQPage`.
The canonical URL is hardcoded to `https://chestlyace.online/`. SEO tags in the HTML source are
placeholders for crawlers that skip JS.

## Subpages are fully static

`software-development.html`, `graphic-design.html`, `photography.html` load no data and no
`app.js` — hand-maintained. `js/app.js` renderers assume `index.html`'s DOM, so do not load it
on a subpage.

## Git

Default branch is `main`; commits are Conventional Commits (`feat:`, `fix:`, `chore:`, `style:`).
`feature/nextjs-migration` currently has **no commits ahead of `main`** — it is an empty branch,
there is no Next.js code in the tree.

`.gitignore` contains `node_modules`, `.env`, and `.superpowers/`. The unreferenced
multi-MB images that used to sit in the repo root are gone; bulk imagery now lives in
`assets/`, so the root holds only the pinned assets listed above plus the four
seed-fixture logos. Keep it that way: add new binaries under `assets/`, and put a file
at the root only when a root-absolute HTML reference or a Neon row requires it — in
which case it must also be added to `PUBLISH` in `scripts/deploy.sh`.
