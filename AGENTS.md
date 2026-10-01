# AGENTS.md

## What this is

Static Tailwind-via-CDN portfolio (`index.html` + 3 subpages) with a separate Express API
(`backend/server.js`) backed by **Neon Postgres** + **Cloudinary**. A password-gated admin
panel (`admin/`) writes to the same DB; the public site reads it at runtime.

## The README and .agent/ are obsolete — ignore them

`README.md` and `.agent/workflows/deploy-netlify.md` describe **MongoDB, Netlify functions,
`npm run seed`, `config/`, `models/`, `scripts/`, `netlify/`, `data/content.json`, and
`/api/content` endpoints**. None of that exists. The stack moved Supabase → Neon Postgres and
the backend to Render. Trust the code, not the docs.

## Commands

Two processes are required; there is no combined dev command.

```bash
# Terminal 1 — static site only (no API)
npm run dev            # root: `serve .` → http://localhost:3000

# Terminal 2 — API
cd backend && npm install && npm start   # Express → http://localhost:5000
```

- `npm start` in `backend/` is plain `node server.js` — **no nodemon, no watch**. Restart manually after edits.
- **No tests, lint, formatter, or typecheck** exist in either package (`npm test` exits 1 by design). No CI, no `render.yaml`, no `netlify.toml`.
- Verify changes with:
  ```bash
  curl http://localhost:5000/health          # {"ok":true}
  curl http://localhost:5000/api/portfolio  # full payload: profile/skills/services/works/journey/socials
  ```
- Ports: `serve` = 3000, Live Server = 5501 (`.vscode/settings.json`), API = 5000.

## API URL is hardcoded twice — no env/config mechanism

Both `js/app.js:1-3` and `admin/admin.js:1-3` contain the same literal ternary:

```js
localhost|127.0.0.1 ? 'http://localhost:5000/api' : 'https://portfolio-webpage-gla4.onrender.com/api'
```

- Pointing the site at a different backend means editing **both** files.
- Any non-localhost hostname (LAN IP, preview domain, tunnel) silently hits **production Render and the production DB**. Do not test on such a hostname.
- Editing the backend means the Render deploy is unaffected — this repo is not wired to auto-deploy.

## Env vars

`dotenv` loads from cwd, so the env file is **`backend/.env`** (gitignored; no `.env.example` exists):
`DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET`→`CLOUDINARY_API_SECRET`,
`JWT_SECRET`, `ADMIN_PASSWORD`, `PORT`.

## Database

- `neon_setup.sql` is the schema **and** seed source of truth (181 lines, `DROP TABLE IF EXISTS` on all 6 tables + 10 `INSERT`s). Re-running it **destroys data**.
- `supabase_setup.sql`, `supabase_update.sql`, `initial_data.sql` are Supabase-era leftovers. `supabase_update.sql`'s `ALTER TABLE` changes are already folded into `neon_setup.sql`.
- Tables: `profile` (single row, `id = 1` hardcoded in `PUT /api/profile`), `skills`, `services`, `works`, `journey` (ordered by `order_index`), `socials`.
- JSONB columns: `services.items`, `works.tech_stack`, `works.highlights`. The backend parses incoming FormData JSON strings then re-stringifies them for `pg`.

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

`.gitignore` contains only `node_modules` and `.env`, so multi-MB images (`btc.png`, `profile.jpg`,
`JAN.2025.png`, …) are tracked. Expect large diffs; don't "clean up" assets unless asked.
