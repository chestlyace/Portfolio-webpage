# Portfolio Repo Restructure — Design

Date: 2026-10-01
Status: Approved (approach B — "web-root-shaped structure")
Repo: `Portfolio-webpage` @ `c7e0f32`, branch `feature/nextjs-migration`

## Problem statement

The repository root mixes four unrelated concerns — public web assets, application
code, database tooling, and Node backend — with no boundary between them. The
consequence is not cosmetic: because deployment copies the repository root into the
nginx document root, **anything at the repo root becomes world-readable over
HTTPS**. That already caused one live incident (§1) and the structure offers no
protection against a repeat.

## Verified facts

All of the following were confirmed against the running server
(`ubuntu@13.49.191.50`) and the live API on 2026-10-01. They are the constraints
the design is built on.

### Deployment topology

| Fact | Evidence |
|---|---|
| Document root is `/var/www/chestlyace` | `nginx sites-available/chestlyace`: `root /var/www/chestlyace;` |
| `/api/` is proxied to `127.0.0.1:5000` | same config |
| The API process runs from `/home/ubuntu/apps/Portfolio-webpage/backend` | `ls -l /proc/468912/cwd` |
| `/var/www/chestlyace` is **not** a git repo | no `.git`; it is a hand-copied snapshot |
| Deploy = manual copy of the repo root | 45 files present, incl. `README.md`, `backend/`, `*.sql` |
| The API runs as a bare `sh -c node server.js` | no systemd unit, no pm2 |

### Public URL constraints (why HTML cannot move)

| Constraint | Evidence |
|---|---|
| All 4 pages are published at the domain root | `sitemap.xml` lists all 4 as `https://chestlyace.online/<page>` |
| Cross-page links are root-absolute | `href="/graphic-design.html"`, `href="/#work"`, `href="/"` |
| Favicons are root-absolute in all 4 pages | `href="/favicon.ico"`, `/favicon-32x32.png`, `/apple-touch-icon.png` |
| `robots.txt` is linked root-absolute | `href="/sitemap.xml"` |

Moving any of these changes indexed URLs or 404s existing links. They are pinned.

### Database-referenced local files (pinned by data, not code)

`GET /api/portfolio` returns 34 Cloudinary URLs and exactly **two** local paths:

- `profile.resume_url = "resume.pdf"`
- `profile.hero_image = "684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png"`

These are **data rows in Neon**, not code references. Moving the files without
updating the rows 404s the live resume button and hero image. Left at root.

### Repo / production drift (repo is behind)

| File | Repo `c7e0f32` | Live server |
|---|---|---|
| `js/app.js` | `... : 'https://portfolio-webpage-gla4.onrender.com/api'` | `: "/api"` |
| `admin/admin.js` | same Render URL | `: "/api"` |
| `index.html` | `src="js/app.js"` | `src="js/app.js?v=20260824-171410"` |
| `admin/index.html` | `src="admin.js"` | cache-busted `?v=…` |

**Render is dead** — `https://portfolio-webpage-gla4.onrender.com/health` returns
`000` (no response); the EC2 API returns `200`. Deploying the repo as-is would
break the live site. This is the single highest-priority repo fix.

Also present on the server only: 5 `.bak-20260824-*` files from a manual edit
session.

## Security incident (resolved 2026-10-01, before this restructure)

`https://chestlyace.online/backend/.env` returned **HTTP 200** — the deployed
`backend/` copy (including `.env`, `.env.save`, `.env.example`, and 116 entries of
`node_modules`) sat inside the document root with no dotfile deny in nginx. The
file contained `DATABASE_URL`, `ADMIN_PASSWORD`, `JWT_SECRET`, and the Cloudinary
API secret. `README.md`, `package.json`, and all `.sql` files were equally public.

That deployed copy was not even the running API (§ deployment topology), so
removing it cost nothing functionally.

### Remediation applied and verified

1. `/var/www/chestlyace/backend/` → `/var/backups/chestlyace/backend-20261001` (root-owned, off-box-root).
2. `index.html.bak-20260824-171410` → `/var/backups/chestlyace/`.
3. nginx hardening block added to `sites-available/chestlyace` (idempotent patch script, backup written on each run):

```nginx
location ^~ /.well-known/acme-challenge/ { root /var/www/certbot; }
location ~ /\.(?!well-known) { deny all; return 404; }
location ^~ /backend/ { return 404; }
location ^~ /data/ { return 404; }
location ~* \.(sql|log|bak|env)$ { return 404; }
location ~* (\.bak|\.old|\.orig|\.save|~)$ { return 404; }
```

The last rule exists because the first pass's `\.bak$` **did not match**
`index.html.bak-20260824-171410`, which was verified still served as `200`.
Matching the marker anywhere in the filename is required.

4. `nginx -t` passed; `systemctl reload nginx` (reload, not restart).
5. `certbot renew --cert-name chestlyace.online --dry-run --no-random-sleep-on-renew`
   → **"all simulated renewals succeeded"**. Certbot uses `authenticator = nginx`
   (nginx plugin), and the `^~` ACME prefix match takes precedence over the dotfile
   regex, so renewal is unaffected. Verified, not assumed.
6. Post-fix checks: `/backend/.env` 404, `/.git/config` 404, `/backend.bak-*/package.json` 404,
   `/` `/graphic-design.html` `/photography.html` `/software-development.html`
   `/favicon.ico` `/resume.pdf` `/hero-optimized.webp` `/robots.txt` `/sitemap.xml`
   `/admin/` all 200, `/api/portfolio` 200.

**Outstanding, owner action:** the exposed credentials are still valid. Rotate
`ADMIN_PASSWORD`, `JWT_SECRET`, the Neon `DATABASE_URL` password, and the
Cloudinary API secret. Note the 24h JWT lifetime means a stolen token stays valid
until it expires.

## Design

### Target tree

Published (docroot) — pinned, must not move:

```
index.html  graphic-design.html  photography.html  software-development.html
favicon.ico  favicon-32x32.png  apple-touch-icon.png
robots.txt  sitemap.xml
hero-optimized.webp
resume.pdf                              ← DB profile.resume_url
684d5ff7-…-5b0dabd64850.png             ← DB profile.hero_image
js/app.js
admin/index.html  admin/admin.js
assets/img/69059dfc-….png               ← moved (nav logo)
assets/img/wa_logo.jpeg                 ← moved (WhatsApp QR)
assets/og/graphic-design-og.webp        ← moved
assets/og/photography-og.webp            ← moved
assets/certs/…                          ← CERT/ renamed
```

Repo-only, never published:

```
backend/   db/neon_setup.sql   scripts/deploy.sh   docs/
AGENTS.md  README.md  package.json  package-lock.json
.agent/  .vscode/  .gitignore  .gitattributes
```

### Moves and deletions

| Action | From → To | Reference updates required |
|---|---|---|
| Move | `69059dfc-….png` → `assets/img/` | `index.html` nav logo `src` |
| Move | `wa_logo.jpeg` → `assets/img/` | `index.html` contact QR `src` |
| Move | `graphic-design-og.webp` → `assets/og/` | absolute `og:image` URL in `graphic-design.html` |
| Move | `photography-og.webp` → `assets/og/` | absolute `og:image` URL in `photography.html` |
| Move | `CERT/` → `assets/certs/` | none (unreferenced; kept for future section) |
| Move | `neon_setup.sql` → `db/` | none |
| Delete | `supabase_setup.sql`, `supabase_update.sql`, `initial_data.sql` | Supabase-era; schema folded into `neon_setup.sql` |
| Delete | `data/content.json` | dead since the MongoDB removal |
| Delete | 15 unreferenced root images (~11MB) | verified unreferenced by HTML/JS/SQL/live DB |
| Keep | `assets/certs/` (7.9MB) | unreferenced, but plausibly intended content |

Deleted images: `btc.png` `Join Us.png` `sherry2.png` `krislogo.png` `JAN.2025.png`
`profile.jpg` `hnd.jpg` `dace.jpg` `logo.jpg` `sherry.jpg` `iusty.jpg` `iusty.jpeg`
`camsoft.png` `camsoft.jpeg` `digimark.jpg`

`git` retains them in history, so any is recoverable with a single revert.

### `scripts/deploy.sh` — allowlist, not excludelist

The incident happened because the whole repo root was published. An `--exclude`
list fails the moment a new file appears at root, including a future `.env`. So
the script `rsync`s an **explicit list of docroot paths** and nothing else.

Also: `--delete` (so removals propagate), pre-flight `nginx -t`, and a `.bak` of
the current docroot on first run. Trade-off accepted: one line to update per new
page or asset, in exchange for the leak being structurally impossible to repeat.

## Implementation order

1. Fix the drift: `js/app.js` + `admin/admin.js` Render URL → `"/api"`; adopt the
   `?v=<timestamp>` cache-bust on `app.js`/`admin.js`.
2. `git mv` the moves; edit the referencing HTML in the same commit.
3. Delete the stale SQL, `data/content.json`, and the 15 images.
4. Write `scripts/deploy.sh` (allowlist).
5. Rewrite `README.md` (currently documents MongoDB + Netlify, both gone).
6. Update `AGENTS.md`: deployment topology, pinned-root list with reasons, `/api`
   path, `deploy.sh` workflow, credential-rotation note.
7. Run `./scripts/deploy.sh`; verify per the checklist below.

Each step is a separate commit so a bad step is a single `git revert`.

## Verification checklist

```
curl -s -o/dev/null -w "%{http_code}" https://chestlyace.online/                      # 200
# …and graphic-design.html, photography.html, software-development.html, /admin/     # 200
curl -s -o/dev/null -w "%{http_code}" https://chestlyace.online/backend/.env         # 404
curl -s -o/dev/null -w "%{http_code}" https://chestlyace.online/.git/config          # 404
curl -s https://chestlyace.online/api/portfolio | jq -r '.profile.resume_url'        # resume.pdf
```

Then load the site and confirm the hero image, nav logo, WhatsApp QR, resume
button, and all three subpages render, and that `/admin/` still saves.

## Explicitly out of scope

- **API process supervision.** The API is a bare `nohup`'d `node server.js` with no
  systemd unit or pm2, so it will not survive a reboot. Real risk, separate change.
- **CORS / auth hardening.** `cors()` is wide open and admin login is a single
  shared password compared with `===`.
- **Full conversion (approach C).** A base-URL variable would allow pages in a
  subfolder, but it changes URLs already indexed in `sitemap.xml`.
- **Git history rewrite** to purge the 11MB of images and the previously committed
  `.env`-adjacent material. History is small enough (`.git` = 20MB) to leave.
- **Extrapolating the three unrelated apps** on the same host (`mamasafe`,
  `iba-tms`, two Docker containers on :8000/:8080). Out of scope; the same nginx
  dotfile exposure likely applies to them and is worth a separate audit.
