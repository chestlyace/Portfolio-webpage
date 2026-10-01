# Portfolio

Personal portfolio site: static HTML/Tailwind frontend, an Express API, a
Postgres database, and Cloudinary for uploads.

## Layout

| Path | Purpose |
|---|---|
| `index.html`, `graphic-design.html`, `photography.html`, `software-development.html` | The four public pages. **Pinned to the document root** — `sitemap.xml` and the root-absolute cross-links between pages depend on it. |
| `js/app.js` | Frontend renderer. Fetches `/api/portfolio` and renders every dynamic section. |
| `admin/` | Password-gated content editor. |
| `assets/` | Images: `img/` inline, `og/` social cards, `certs/` Google badges. |
| `backend/` | Express API. **Never published** — not part of the deploy allowlist. |
| `db/neon_setup.sql` | Schema **and** seed data. Running it drops all tables. |
| `scripts/check-assets.mjs` | Fails if any HTML `src`/`href` does not resolve. |
| `scripts/deploy.sh` | Allowlist deploy to the document root. |

Two files sit at the repo root because **database rows** reference them:

- `resume.pdf` — `profile.resume_url`. Also the `href="resume.pdf"` fallback in
  `index.html`, which `js/app.js` overwrites at runtime with the same value.
- `684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png` — `profile.hero_image`. Nothing in
  the repo references it.

Moving either 404s the live site until those rows are updated.

## Local development

Two processes; there is no combined dev command.

```bash
npm install && npm run dev          # static site on http://localhost:3000
cd backend && npm install && npm start   # API on http://localhost:5000
```

The frontend uses `http://localhost:5000/api` on `localhost`/`127.0.0.1` and
`/api` everywhere else. `backend/` is plain `node server.js` — no watch, restart
manually. There is no test, lint, or typecheck step.

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

## Deploying

```bash
./scripts/deploy.sh           # dry run, prints the diff
./scripts/deploy.sh --apply   # publish
```

Publishes only the allowlisted docroot paths and deletes anything else from the
document root. See `docs/superpowers/specs/2026-10-01-repo-restructure-design.md`
for why the allowlist exists.

## Deployment topology

nginx on the EC2 host serves the document root and proxies `/api/` to a Node
process on `127.0.0.1:5000`. That process runs from a separate clone, **not**
from this repo, so backend code changes need their own deploy step.

## License

ISC
