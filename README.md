# Portfolio

Personal portfolio site: a Next.js static export, an Express API, a Postgres
database, and Cloudinary for uploads.

## Layout

| Path | Purpose |
|---|---|
| `app/` | App Router routes. `(home)/` holds the index page; each of `graphic-design/`, `photography/`, `software-development/` has its own root layout. |
| `components/` | Page sections, grouped by area. |
| `lib/` | Data fetching, types, SEO updater, design-lightbox state, Cloudinary URL transforms. |
| `public/` | **Everything static that gets published.** Copied verbatim into `out/` by the build, so a file must live here to reach the document root. |
| `admin/` | Password-gated content editor. **The one hand-maintained directory that ships as-is** — no build step, deliberately survives a build failure. |
| `backend/` | Express API. **Never published** — not in the deploy allowlist. |
| `db/neon_setup.sql` | Schema **and** seed data. Running it drops all tables. |
| `scripts/finalize-export.mjs` | Post-build pass over `out/`. |
| `scripts/check-assets.mjs` | Fails if any published `src`/`href`/`og:`/sitemap `<loc>` does not resolve. |
| `scripts/deploy.sh` | Allowlist deploy to the document root. |

### Two root layouts, on purpose

`app/(home)/layout.tsx` carries the index page's `<head>` verbatim. The three
subpages each get their own root layout carrying their own `<head>`, because a
shared layout would merge the index's meta tags onto them, and React 19 does not
hoist `<script type="application/ld+json">` — the subpages' structured data
cannot be injected the way the index's is. Route groups do not change URLs.

The subpages keep `<script src="https://cdn.tailwindcss.com">` and do **not**
import the home page's stylesheet, because that is what the pre-migration sources
did: they have no stylesheet link, and the CDN now resolves to Tailwind v4 while
the home build is v3.4. **They therefore still log the
`cdn.tailwindcss.com should not be used in production` warning**, exactly as they
did before the migration. That is faithful, not a regression.

### Two files at the repo root because database rows reference them

`resume.pdf` and `684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png` are tracked at the
root *and* copied into `public/`. Only the `public/` copies are published now; the
root copies are leftovers of the hand-copied site. Moving or deleting either
`public/` copy 404s the live resume button or hero image until the database rows
are updated, which is why `scripts/check-assets.mjs` asserts them.

`logoNGcodeX.png`, `yibs.png`, `digimark.jpeg` and `ets_nhahealthtech_logo.jpeg`
look unreferenced because nothing in the HTML names them — but
`db/neon_setup.sql` seeds `journey.logo_url` with those bare filenames, so a
fresh seed would 404 without them.

`assets/` at the root is a leftover duplicate of `public/assets/` (byte-identical,
21 files). Nothing references it and it is not published; it exists only in the
repo. Deleting it is safe but is left as an explicit decision rather than done
silently.

## Local development

```bash
npm install
npm run dev        # http://localhost:3001 (the port is hardcoded in package.json)
```

**There is no runnable local API.** `backend/.env` on this machine still points
at a dead Neon host, and the local Postgres rejects `portfolio_user`. So in dev,
`lib/api.ts` reads the **live** API at `https://chestlyace.online/api` and the page
renders with real data. That branch is read-only and never mutates.

`lib/api.ts` resolves the API URL in this order:

1. `NEXT_PUBLIC_API_URL`, if set.
2. On `localhost`/`127.0.0.1`: the live origin, per the note above.
3. Otherwise `/api`, which nginx proxies to `127.0.0.1:5000`.

`admin/admin.js` is not migrated and keeps its own hostname ternary, so changing
the backend host means editing **both** files.

## Configuration

`backend/.env` (gitignored; `dotenv` loads from the working directory, so it must
live in `backend/`):

```
DATABASE_URL=            # local PostgreSQL connection string
JWT_SECRET=
ADMIN_PASSWORD=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PORT=5000
```

## Building

```bash
npm run build
```

Three steps: `next build` (static export into `out/`), then
`scripts/finalize-export.mjs`, then `scripts/check-assets.mjs`. The build **fails**
if a published reference dangles or a sitemap `<loc>` has no exported page.

`output: 'export'` is a static export, so there is no server to start. The
`start` script (`next start`) does not work with it and is vestigial.

## Deploying

```bash
npm run build            # REQUIRED FIRST -- deploy.sh publishes out/, so
                         # deploying without rebuilding ships the last build
./scripts/deploy.sh           # dry run, prints the diff
./scripts/deploy.sh --apply   # publish
```

Publishes `out/`'s contents and `admin/`, and deletes everything else from the
document root — including the old `js/` and the loose root HTML and binaries. See
`docs/superpowers/specs/2026-10-01-repo-restructure-design.md` for why the
allowlist exists.

`out/` and `public/` are directories, so the allowlist's "nothing else can be
published by accident" guarantee now rests on the two guards in `deploy.sh` that
scan the published trees for unsafe file names and credential-shaped content,
rather than on the allowlist alone. Keep secrets out of `public/`.

## Deployment topology

nginx on the EC2 host serves the document root and proxies `/api/` to a Node
process on `127.0.0.1:5000`. That process runs from a separate clone, **not**
from this repo, so backend code changes need their own deploy step.

## License

ISC
