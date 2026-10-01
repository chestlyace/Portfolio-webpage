# Portfolio Repo Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `Portfolio-webpage` so only the site's public files can reach the nginx document root, fix the repo's stale Render API URL, and remove ~11MB of unreferenced images — without changing any indexed URL or breaking the live site.

**Architecture:** The document root (`/var/www/chestlyace`) is a hand-copied snapshot of the repo root, so "what's at the repo root" is exactly "what is public on the internet." The restructure pins the files that genuinely must be root (4 HTML pages, favicons, `robots.txt`/`sitemap.xml`, and two assets referenced by Neon *data rows*) and moves everything else into `assets/`, `db/`, and `scripts/`. Publication becomes an explicit allowlist in `scripts/deploy.sh` rather than a whole-root copy, so the class of bug that exposed `backend/.env` cannot recur.

**Tech Stack:** Static HTML + Tailwind CDN, vanilla JS, Node 24 (Express 5, `pg`), Nginx, Neon Postgres, Cloudinary. No test framework, no linter, no build step — so the test oracle is a purpose-built asset-integrity checker plus HTTP-level verification.

**Spec:** `docs/superpowers/specs/2026-10-01-repo-restructure-design.md` — the plan argues from the spec; read both.

## Global Constraints

- **Never change an indexed URL.** All 4 pages stay at the web root. `sitemap.xml` publishes `https://chestlyace.online/`, `/graphic-design.html`, `/photography.html`, `/software-development.html`. Cross-page links are root-absolute (`href="/graphic-design.html"`, `href="/#work"`).
- **Never move these two files:** `resume.pdf` and `684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png`. They are referenced by Neon rows `profile.resume_url` and `profile.hero_image`, not by any repo file. Moving them 404s the live site until the DB is updated.
- **Never move these either** (referenced root-absolute by all 4 pages or by `sitemap.xml`): `favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png`, `robots.txt`, `sitemap.xml`, `hero-optimized.webp`.
- **Do not edit the live database.** All content changes are repo-side.
- **Server access:** `ssh -i /home/ace/MamaSafeKeyPair.pem ubuntu@13.49.191.50`. Passwordless sudo confirmed. `rsync` 3.4.1 on server, 3.4.4 locally.
- **Nginx hardening is already applied** to `/etc/nginx/sites-available/chestlyace` (dotfile deny, `/backend/` + `/data/` deny, `.sql|.log|.bak|.env` deny, backup-marker deny, ACME allow). Backup configs exist as `chestlyace.bak-20261001-*`. `backend/` was moved off the docroot to `/var/backups/chestlyace/`. **This plan does not re-do that work** and must not revert it.
- **One commit per task.** Each ends with an independently verifiable deliverable so a bad task is a single `git revert`.
- Working branch: `chore/repo-restructure` (already created; `main` is untouched).

---

### Task 1: Fix the stale API URL (highest priority)

The repo points at `portfolio-webpage-gla4.onrender.com`, which is **dead** (`/health` returns `000`). Production uses `"/api"`. Deploying the repo as-is breaks the live site. This is the only change in the plan that is urgent rather than cosmetic.

**Files:**
- Modify: `js/app.js:1-3`
- Modify: `admin/admin.js:1-3`
- Modify: `index.html:916`
- Modify: `admin/index.html:394`

**Interfaces:**
- Consumes: nothing.
- Produces: both frontends resolve the API to the same-origin `/api` path; a `CACHE_BUST` value used by both script tags.

- [ ] **Step 1: Confirm the drift is real before changing anything**

```bash
cd /home/ace/Projects/Portfolio-webpage
grep -n "onrender.com" js/app.js admin/admin.js
curl -s -o /dev/null -w "render /health -> %{http_code}\n" --max-time 10 https://portfolio-webpage-gla4.onrender.com/health
curl -s -o /dev/null -w "live /api/portfolio -> %{http_code}\n" --max-time 15 https://chestlyace.online/api/portfolio
```

Expected: two `onrender.com` matches; Render `000`; live API `200`. If Render answers `200`, **stop** — someone resurrected it and the design's premise needs revisiting.

- [ ] **Step 2: Point both frontends at the same-origin API**

In `js/app.js` replace lines 1-3:

```js
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : "/api";
```

In `admin/admin.js` replace lines 1-3 with the identical block. The production server already uses exactly this text, so the repo now matches what is actually running.

- [ ] **Step 3: Add cache-busting to both script tags**

`index.html:916` — replace `<script src="js/app.js"></script>` with:

```html
  <script src="js/app.js?v=20261001-restructure"></script>
```

`admin/index.html:394` — replace `<script src="admin.js"></script>` with:

```html
  <script src="admin.js?v=20261001-restructure"></script>
```

Without this, returning visitors keep the cached `app.js` and the site silently half-updates.

- [ ] **Step 4: Verify no Render reference survives anywhere**

```bash
cd /home/ace/Projects/Portfolio-webpage
grep -rn "onrender" --include=*.js --include=*.html . --exclude-dir=node_modules && echo "FAIL: Render still referenced" || echo "OK: no Render references"
grep -n 'src="js/app.js' index.html
grep -n 'src="admin.js' admin/index.html
```

Expected: "OK: no Render references", then the two `?v=20261001-restructure` lines.

- [ ] **Step 5: Syntax-check the JS and commit**

```bash
cd /home/ace/Projects/Portfolio-webpage
node --check js/app.js && node --check admin/admin.js && echo "JS syntax OK"
git add js/app.js admin/admin.js index.html admin/index.html
git commit -m "fix: point frontend at same-origin /api instead of dead Render host

The Render deployment (portfolio-webpage-gla4) no longer responds; the live
site is served by nginx on the EC2 host, which proxies /api/ to the Node
backend on :5000. The repo still pointed at Render, so any deploy from this
branch would have broken the live site.

Also add cache-busting query strings, matching the convention already used in
production, so the change reaches returning visitors."
```

---

### Task 2: Add an asset-integrity checker

The remaining tasks move files. Without a mechanical way to prove no reference was left dangling, each move would rely on visual inspection alone. This task builds the oracle and establishes a passing baseline **before** anything moves, so later failures are genuinely caused by later moves.

**Files:**
- Create: `scripts/check-assets.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `node scripts/check-assets.mjs` — exits `0` when every `src`/`href` in the site's HTML resolves to a file in the repo (and the two data-pinned files exist), `1` with a per-reference report otherwise. Tasks 3-5 and 9 run it as their test.

- [ ] **Step 1: Write the checker**

Create `scripts/check-assets.mjs`:

```javascript
#!/usr/bin/env node
/**
 * Asset integrity checker.
 *
 * Every src/href in the site's HTML must resolve to a real file in this repo.
 * Run after any file move to prove no reference was left dangling.
 *
 *   node scripts/check-assets.mjs
 *
 * Exit 0 = all references resolve. Exit 1 = at least one is missing.
 *
 * Covered: src/href attributes and og:image/og:url meta tags across the five
 * HTML sources, plus the two files referenced by Neon data rows.
 *
 * Not covered: URLs returned by the API at runtime (Cloudinary), and the
 * bare-string image fallbacks inside js/app.js.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// HTML only. js/app.js and admin/admin.js are deliberately excluded: they build
// markup with template literals, so `src="${work.image_url}"` matches a naive
// attribute regex and reports runtime values as missing files.
const SOURCES = [
  'index.html',
  'graphic-design.html',
  'photography.html',
  'software-development.html',
  'admin/index.html',
];

/**
 * Referenced by Neon data rows (profile.resume_url, profile.hero_image), not by
 * any file in the repo. Moving them 404s the live resume button and hero image
 * until the database rows are updated. Asserted here so the constraint is
 * machine-checked rather than tribal knowledge.
 */
const PINNED_BY_DATA = [
  'resume.pdf',
  '684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png',
];

const ATTR = /(?:src|href)\s*=\s*["']([^"']+)["']/g;
// og:image / og:url are carried by `content=`, not `src`/`href`, so they need
// their own pattern or moving an OG image goes completely unchecked.
const OG = /<meta[^>]+property="og:(?:image|image:url|url)"[^>]+content="([^"]+)"/g;
// Any scheme (https:, mailto:, tel:, data:) or protocol-relative or bare anchor.
const OPAQUE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;
// Absolute URLs on our own domain are really docroot-relative; strip the origin
// so moving an OG image is caught instead of silently skipped.
const OWN_ORIGIN = /^https?:\/\/(?:www\.)?chestlyace\.online/;

const problems = [];
let checked = 0;

function check(sourceRel, ref, absTarget) {
  checked++;
  if (!existsSync(absTarget)) {
    problems.push(`  ${sourceRel}\n    ref:     ${ref}\n    missing: ${relative(REPO_ROOT, absTarget)}`);
  }
}

for (const sourceRel of SOURCES) {
  const abs = join(REPO_ROOT, sourceRel);
  const html = readFileSync(abs, 'utf8');

  for (const match of html.matchAll(ATTR)) {
    const original = match[1].trim();
    if (!original) continue;

    let ref = original.replace(OWN_ORIGIN, '');
    if (OPAQUE.test(ref)) continue;

    ref = ref.split('#')[0].split('?')[0];
    if (!ref || ref === '/') continue;

    // Root-absolute resolves against the docroot (= repo root); relative
    // resolves against the directory of the file containing it.
    const target = ref.startsWith('/')
      ? join(REPO_ROOT, ref)
      : resolve(dirname(abs), ref);

    check(sourceRel, original, target);
  }

  for (const match of html.matchAll(OG)) {
    const original = match[1].trim();
    if (!original) continue;

    const ref = original.replace(OWN_ORIGIN, '');
    if (OPAQUE.test(ref)) continue;
    if (!ref) continue;

    check(sourceRel, original, join(REPO_ROOT, ref));
  }
}

for (const pinned of PINNED_BY_DATA) {
  // Resolve against REPO_ROOT: existsSync() on a bare relative path would test
  // against process.cwd(), so this would fail no matter where the script is run.
  check('(Neon data row)', pinned, join(REPO_ROOT, pinned));
}

if (problems.length) {
  console.error(`FAIL: ${problems.length} unresolved reference(s) of ${checked} checked\n`);
  console.error(problems.join('\n\n'));
  process.exit(1);
}

console.log(`OK: ${checked} references resolve across ${SOURCES.length} source files`);
console.log(`OK: ${PINNED_BY_DATA.length} data-pinned files present`);
```

- [ ] **Step 2: Run it and expect a clean baseline**

```bash
cd /home/ace/Projects/Portfolio-webpage
node scripts/check-assets.mjs
```

Expected: `OK: 37 references resolve across 5 source files` and `OK: 2 data-pinned files present`, exit 0.

**If this fails, stop.** The tree is already inconsistent and Task 1's edits may be implicated. Fix or record the pre-existing failure before moving anything — otherwise later tasks inherit a broken oracle.

- [ ] **Step 3: Prove the checker actually detects breakage**

The code above is **already validated** — it was extracted from this plan and run against a throwaway copy of the repo, and all six cases passed: baseline passes; a broken relative `src`, a broken root-absolute `href`, a broken same-origin absolute URL, and a deleted data-pinned file each fail with a named report; and external URLs are ignored. Three bugs were found and fixed during that validation, so keep them in mind if you edit the script:

- `og:image` is carried by `content=`, not `src`/`href`. A `src|href`-only regex matches nothing and would leave every OG image move completely unchecked — the exact thing Task 4 relies on this checker to catch.
- Scanning `js/app.js` / `admin/admin.js` reports template literals like `src="${work.image_url}"` as missing files. Hence `SOURCES` is HTML only.
- `existsSync()` on a bare relative path tests against `process.cwd()`, not the repo. Both the `PINNED_BY_DATA` and OG branches must pass `join(REPO_ROOT, …)`.

Re-run the equivalent after any edit to the script:

```bash
cd /home/ace/Projects/Portfolio-webpage
cp index.html /tmp/index.html.orig
sed -i 's|src="wa_logo.jpeg"|src="wa_logo-DOES-NOT-EXIST.jpeg"|' index.html
node scripts/check-assets.mjs; echo "exit=$?"
cp /tmp/index.html.orig index.html && rm /tmp/index.html.orig
node scripts/check-assets.mjs >/dev/null && echo "restored, baseline green again"
```

Expected: a `FAIL: 1 unresolved reference` report naming the file, `exit=1`, then the restored run prints "restored, baseline green again". A checker that cannot fail is worthless — do not skip this step.

- [ ] **Step 4: Commit**

```bash
cd /home/ace/Projects/Portfolio-webpage
git add scripts/check-assets.mjs
git commit -m "test: add asset integrity checker

Static HTML has no build step to catch a moved file with a stale reference, so
add a dependency-free Node script that resolves every src/href in the site's
HTML against the repo. Also asserts the two files referenced by Neon data rows
(resume.pdf, the hero image) still exist, since no repo file references them."
```

---

### Task 3: Move static images into `assets/img/`

`69059dfc-….png` is the nav/footer logo and `wa_logo.jpeg` is the WhatsApp QR. Both are referenced with plain relative `src`, so they move cleanly. **The logo appears twice** (`index.html:251` and `index.html:775`) — both must change.

**Files:**
- Move: `69059dfc-d514-4861-b68a-3de1b6f12b58.png` → `assets/img/69059dfc-d514-4861-b68a-3de1b6f12b58.png`
- Move: `wa_logo.jpeg` → `assets/img/wa_logo.jpeg`
- Modify: `index.html:251`, `index.html:610`, `index.html:775`

**Interfaces:**
- Consumes: `node scripts/check-assets.mjs` from Task 2.
- Produces: `assets/img/` as the home for inline site images; `assets/og/` and `assets/certs/` follow in Task 4.

- [ ] **Step 1: Record the references before touching them**

```bash
cd /home/ace/Projects/Portfolio-webpage
grep -n "69059dfc\|wa_logo" index.html
```

Expected: exactly 3 matches — lines 251, 610, 775.

- [ ] **Step 2: Move the files with history preserved**

```bash
cd /home/ace/Projects/Portfolio-webpage
mkdir -p assets/img
git mv "69059dfc-d514-4861-b68a-3de1b6f12b58.png" assets/img/
git mv "wa_logo.jpeg" assets/img/
ls -la assets/img/
```

Use `git mv`, not `mv`, so the rename is tracked and `git log --follow` works.

- [ ] **Step 3: Update all three references**

In `index.html`, replace all occurrences of the two old paths:

```bash
cd /home/ace/Projects/Portfolio-webpage
sed -i 's|src="69059dfc-d514-4861-b68a-3de1b6f12b58.png"|src="assets/img/69059dfc-d514-4861-b68a-3de1b6f12b58.png"|g' index.html
sed -i 's|src="wa_logo.jpeg"|src="assets/img/wa_logo.jpeg"|g' index.html
grep -n "assets/img/" index.html
```

Expected: 3 lines, all prefixed `assets/img/`. Confirm 3, not 2 — the `g` flag matters for the logo.

- [ ] **Step 4: Verify no stale reference and the checker is green**

```bash
cd /home/ace/Projects/Portfolio-webpage
grep -n 'src="69059dfc\|src="wa_logo.jpeg"' index.html && echo "FAIL: stale ref" || echo "OK: no stale refs"
node scripts/check-assets.mjs
```

Expected: `OK: no stale refs`, then the checker passes.

- [ ] **Step 5: Commit**

```bash
cd /home/ace/Projects/Portfolio-webpage
git add index.html assets/
git commit -m "refactor: move inline site images into assets/img

The nav/footer logo and the WhatsApp QR were the last loose images at the
repo root, where everything is publishable by virtue of the deploy allowlist.
Both are referenced relatively, so this is a mechanical path change; the logo
appears twice in index.html and both sites are updated."
```

---

### Task 4: Move OG images, certs, and SQL; delete Supabase-era files

**Files:**
- Move: `graphic-design-og.webp` → `assets/og/graphic-design-og.webp`
- Move: `photography-og.webp` → `assets/og/photography-og.webp`
- Move: `CERT/*` → `assets/certs/*`
- Move: `neon_setup.sql` → `db/neon_setup.sql`
- Delete: `supabase_setup.sql`, `supabase_update.sql`, `initial_data.sql`, `data/content.json`
- Modify: `graphic-design.html:22`, `photography.html:22`

**Interfaces:**
- Consumes: `node scripts/check-assets.mjs` (Task 2).
- Produces: `assets/og/`, `assets/certs/`, `db/`. The `db/` path is where `neon_setup.sql` lives for the rest of the project's life.

- [ ] **Step 1: Move the OG images and certs**

```bash
cd /home/ace/Projects/Portfolio-webpage
mkdir -p assets/og db
git mv graphic-design-og.webp assets/og/
git mv photography-og.webp assets/og/
git mv CERT assets/certs
git mv neon_setup.sql db/
git status --short | head -30
```

`hero-optimized.webp` and `software-development-og.webp`-style references to it stay put: `hero-optimized.webp` is root-absolute in `og:image` and is the `js/app.js` fallback, so it is pinned.

- [ ] **Step 2: Update the absolute OG image URLs**

OG tags use fully-qualified URLs, so update the whole URL, not just the filename:

```bash
cd /home/ace/Projects/Portfolio-webpage
sed -i 's|https://chestlyace.online/graphic-design-og.webp|https://chestlyace.online/assets/og/graphic-design-og.webp|' graphic-design.html
sed -i 's|https://chestlyace.online/photography-og.webp|https://chestlyace.online/assets/og/photography-og.webp|' photography.html
grep -n 'og:image" content' *.html
```

Expected: `graphic-design.html` and `photography.html` now point at `/assets/og/…`; `index.html` and `software-development.html` still point at `https://chestlyace.online/hero-optimized.webp` (pinned, unchanged).

- [ ] **Step 3: Confirm the checker maps absolute URLs back to the docroot**

This is why the checker strips our own origin — it must catch this class of move:

```bash
cd /home/ace/Projects/Portfolio-webpage
node scripts/check-assets.mjs
```

Expected: passes. If it reports the OG images missing, the `OWN_ORIGIN` strip in the checker is not working — fix the checker, do not work around it.

- [ ] **Step 4: Delete the Supabase-era files**

Before deleting, confirm nothing references them:

```bash
cd /home/ace/Projects/Portfolio-webpage
grep -rn "supabase_setup\|supabase_update\|initial_data\|content.json" \
  --include=*.html --include=*.js --include=*.md --include=*.json . \
  --exclude-dir=node_modules --exclude-dir=docs || echo "OK: no live references"
```

Expected: no hits (a hit inside `README.md` or `docs/` is documentation prose, not a reference — note it, Task 7 rewrites `README.md`). Then:

```bash
cd /home/ace/Projects/Portfolio-webpage
git rm -q supabase_setup.sql supabase_update.sql initial_data.sql data/content.json
```

Rationale for each: the project moved Supabase → Neon Postgres, and `neon_setup.sql` already contains the `ALTER TABLE` additions that `supabase_update.sql` made. `data/content.json` has been dead since the MongoDB removal — nothing reads it.

- [ ] **Step 5: Verify and commit**

```bash
cd /home/ace/Projects/Portfolio-webpage
node scripts/check-assets.mjs
ls assets/ db/
git add -A
git commit -m "refactor: move OG images, certs and SQL into assets/ and db/

OG images and the 7.9MB CERT badge directory move under assets/; the OG tags use
absolute URLs so both the URL and the file location change. neon_setup.sql
becomes the single schema+seed source of truth under db/.

Delete the Supabase-era schema files (their ALTER TABLE additions are already
folded into neon_setup.sql) and data/content.json, dead since the MongoDB
removal. CERT is kept, not deleted: nothing renders it yet but the badges look
like intended content."
```

---

### Task 5: Delete the unreferenced images

**Files:**
- Delete: 15 root images, ~11MB total

**Interfaces:**
- Consumes: `node scripts/check-assets.mjs` (Task 2).
- Produces: a root containing only publishable, referenced assets.

The list (verified unreferenced by any HTML, JS, SQL, or the live database):
`btc.png` `Join Us.png` `sherry2.png` `krislogo.png` `JAN.2025.png` `profile.jpg`
`hnd.jpg` `dace.jpg` `logo.jpg` `sherry.jpg` `iusty.jpg` `iusty.jpeg` `camsoft.png`
`camsoft.jpeg` `digimark.jpg`

- [ ] **Step 1: Re-verify each file is unreferenced before deleting**

```bash
cd /home/ace/Projects/Portfolio-webpage
for f in btc.png "Join Us.png" sherry2.png krislogo.png JAN.2025.png profile.jpg hnd.jpg dace.jpg logo.jpg sherry.jpg iusty.jpg iusty.jpeg camsoft.png camsoft.jpeg digimark.jpg; do
  hits=$(grep -rlF "$f" --include=*.html --include=*.js --include=*.sql --include=*.xml . --exclude-dir=node_modules --exclude-dir=docs 2>/dev/null | grep -v "^./$f$")
  [ -n "$hits" ] && echo "STILL REFERENCED: $f <- $hits"
done; echo "scan complete"
```

Expected: `scan complete` with no `STILL REFERENCED` lines. **If any file is still referenced, stop and leave it in place** — report it instead of deleting.

- [ ] **Step 2: Confirm the live database does not reference them**

The API is the authority on DB-held paths; 34 of 36 asset URLs are Cloudinary and the 2 local ones are the pinned pair:

```bash
curl -s --max-time 20 https://chestlyace.online/api/portfolio \
  | grep -oE '"(hero_image|resume_url|image_url|logo_url)":"[^"]*"' \
  | grep -v "cloudinary" | sort -u
```

Expected: exactly two lines — `"resume_url":"resume.pdf"` and `"hero_image":"684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png"`. Anything else is a hard stop.

- [ ] **Step 3: Delete them**

```bash
cd /home/ace/Projects/Portfolio-webpage
git rm -q btc.png "Join Us.png" sherry2.png krislogo.png JAN.2025.png profile.jpg hnd.jpg dace.jpg logo.jpg sherry.jpg iusty.jpg iusty.jpeg camsoft.png camsoft.jpeg digimark.jpg
ls *.png *.jpg *.jpeg 2>/dev/null
```

Expected remaining root images: `favicon-32x32.png`, `apple-touch-icon.png`, `684d5ff7-…png` (pinned), and four that no HTML references — `logoNGcodeX.png`, `yibs.png`, `digimark.jpeg`, `ets_nhahealthtech_logo.jpeg` (handled in Step 4).

- [ ] **Step 4: Handle the images with no HTML reference**

`logoNGcodeX.png`, `yibs.png`, `digimark.jpeg`, `ets_nhahealthtech_logo.jpeg` were referenced **only** by `supabase_setup.sql` / `neon_setup.sql` / `initial_data.sql`. They are not in the live database (Step 2 proved that) and not in any HTML — but they are not orphans either: `db/neon_setup.sql:167-170` seeds `journey.logo_url` with exactly those four filenames.

```bash
cd /home/ace/Projects/Portfolio-webpage
grep -n "logoNGcodeX\|yibs.png\|digimark.jpeg\|ets_nhahealthtech" db/neon_setup.sql
```

Decision: **keep them** — deleting them would make a fresh `db/neon_setup.sql` seed produce four broken logo URLs. Document the reason in `AGENTS.md` (Task 8).

- [ ] **Step 5: Verify and commit**

```bash
cd /home/ace/Projects/Portfolio-webpage
node scripts/check-assets.mjs
du -sh --exclude=node_modules --exclude=.git .
git add -A
git commit -m "chore: delete 15 unreferenced root images (~11MB)

Verified unreferenced by any HTML, JS, SQL file and by the live API payload.
They were being published to the internet purely because they sat in the repo
root. Removable from history with a revert if any turns out to be needed.

logoNGcodeX/yibs/digimark/ets_nhahealthtech are kept despite having no HTML
reference: db/neon_setup.sql seeds journey logo_url with those filenames."
```

---

### Task 6: Write the allowlist deploy script

This is the structural fix. The exposure happened because the whole repo root was copied into the docroot; an `--exclude` list would fail the next time someone drops a new file (or a `.env`) at root. An explicit allowlist makes that impossible.

**Files:**
- Create: `scripts/deploy.sh`

**Interfaces:**
- Consumes: nothing.
- Produces: `./scripts/deploy.sh` (dry run, prints a diff) and `./scripts/deploy.sh --apply` (publishes). Env overrides: `DEPLOY_REMOTE`, `DEPLOY_ROOT`, `DEPLOY_KEY`.

- [ ] **Step 1: Write the script**

Create `scripts/deploy.sh`:

```bash
#!/usr/bin/env bash
#
# Publish the site to the nginx document root.
#
#   ./scripts/deploy.sh           # dry run: print what would change, change nothing
#   ./scripts/deploy.sh --apply   # publish for real
#
# This uses an ALLOWLIST, not an excludelist, on purpose. The document root is
# served to the entire internet, and an excludelist fails the moment a new file
# appears in the repo root -- including a .env. Only the paths below are ever
# published, so anything else in the repo is private by construction.
#
# Overridable: DEPLOY_REMOTE, DEPLOY_ROOT, DEPLOY_KEY
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="${DEPLOY_REMOTE:-ubuntu@13.49.191.50}"
REMOTE_ROOT="${DEPLOY_ROOT:-/var/www/chestlyace}"
KEY="${DEPLOY_KEY:-$HOME/MamaSafeKeyPair.pem}"
APPLY="${1:-}"

if [ ! -f "$KEY" ]; then
  echo "ERROR: SSH key not found at $KEY (override with DEPLOY_KEY=...)" >&2
  exit 1
fi

# --- The allowlist. Adding a new page or asset means adding a line here. ---
PUBLISH=(
  # HTML pages are pinned to the docroot by sitemap.xml and root-absolute links.
  index.html
  graphic-design.html
  photography.html
  software-development.html
  # Pinned: referenced root-absolute by all four pages.
  favicon.ico
  favicon-32x32.png
  apple-touch-icon.png
  robots.txt
  sitemap.xml
  hero-optimized.webp
  # Pinned by Neon data rows (profile.resume_url / profile.hero_image).
  resume.pdf
  684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png
  # Directories are copied whole.
  js
  admin
  assets
)

# --- Guard 1: every allowlisted path must exist, so a typo fails loudly. ---
for p in "${PUBLISH[@]}"; do
  if [ ! -e "$REPO_ROOT/$p" ]; then
    echo "ERROR: allowlisted path does not exist: $p" >&2
    exit 1
  fi
done

# --- Guard 2: refuse to publish anything that could carry a secret. ---
for p in "${PUBLISH[@]}"; do
  case "$p" in
    backend|data|*.env|*.sql|*.log|*.bak*)
      echo "ERROR: unsafe path in PUBLISH allowlist: $p" >&2
      exit 1
      ;;
  esac
done

# --- Guard 3: scan publishable content for credential-shaped assignments. ---
if grep -rlE '(DATABASE_URL|JWT_SECRET|ADMIN_PASSWORD|CLOUDINARY_API_SECRET)[[:space:]]*=' \
     "$REPO_ROOT/js" "$REPO_ROOT/admin" "$REPO_ROOT/index.html" 2>/dev/null | grep -q .; then
  echo "ERROR: credential-shaped content found in publishable paths" >&2
  exit 1
fi

# --- Guard 4: local asset integrity must be green before publishing. ---
if ! node "$REPO_ROOT/scripts/check-assets.mjs"; then
  echo "ERROR: asset check failed - not deploying" >&2
  exit 1
fi

# --- Stage only the allowlist, so --delete mirrors exactly this set. ---
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
for p in "${PUBLISH[@]}"; do
  cp -a "$REPO_ROOT/$p" "$STAGE/"
done

echo "==> ${#PUBLISH[@]} paths staged from $REPO_ROOT"
echo "==> target: $REMOTE:$REMOTE_ROOT"

# --- Refuse to publish if the server's nginx config is broken. ---
ssh -i "$KEY" -o StrictHostKeyChecking=no "$REMOTE" "sudo nginx -t" >/dev/null 2>&1 || {
  echo "ERROR: remote nginx config is invalid - fix it first" >&2
  exit 1
}

RSYNC=(rsync -az --delete --itemize-changes --rsync-path="sudo rsync" -e "ssh -i $KEY -o StrictHostKeyChecking=no")

if [ "$APPLY" != "--apply" ]; then
  echo "==> DRY RUN (pass --apply to publish):"
  "${RSYNC[@]}" --dry-run "$STAGE/" "$REMOTE:$REMOTE_ROOT/"
  exit 0
fi

echo "==> PUBLISHING:"
"${RSYNC[@]}" "$STAGE/" "$REMOTE:$REMOTE_ROOT/"

# Keep parity with the existing www-data ownership so nginx behaviour is unchanged.
ssh -i "$KEY" -o StrictHostKeyChecking=no "$REMOTE" \
  "sudo chown -R www-data:www-data '$REMOTE_ROOT' && sudo nginx -t && sudo systemctl reload nginx"

echo "==> done. Published files:"
ssh -i "$KEY" -o StrictHostKeyChecking=no "$REMOTE" "ls -1 '$REMOTE_ROOT'"
```

- [ ] **Step 2: Make it executable and confirm the dry run is safe**

```bash
cd /home/ace/Projects/Portfolio-webpage
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Expected: the staged path count, the target, `DRY RUN`, and an itemised rsync listing — and **the live site must be untouched**. Confirm immediately:

```bash
curl -s -o/dev/null -w "live / -> %{http_code}\n" --max-time 10 https://chestlyace.online/
```

- [ ] **Step 3: Verify the guards actually fire**

```bash
cd /home/ace/Projects/Portfolio-webpage
cp scripts/deploy.sh /tmp/deploy.sh.orig
sed -i 's|^  resume.pdf$|  resume.pdf\n  backend|' scripts/deploy.sh
./scripts/deploy.sh; echo "exit=$? (expect 1, 'unsafe path in PUBLISH allowlist')"
cp /tmp/deploy.sh.orig scripts/deploy.sh && rm /tmp/deploy.sh.orig
```

Expected: the guard rejects `backend` and exits 1. A guard that never fires is decoration — confirm it fires, then restore.

- [ ] **Step 4: Verify a published secret is still unreachable after deploy**

Do this after Task 9's deploy, not here — this step only proves the guard logic:

```bash
cd /home/ace/Projects/Portfolio-webpage
grep -c "backend\|data\|\.sql" scripts/deploy.sh   # guards present in source
```

- [ ] **Step 5: Commit**

```bash
cd /home/ace/Projects/Portfolio-webpage
git add scripts/deploy.sh
git commit -m "feat: add allowlist deploy script

Publishing was a manual copy of the whole repo root, which is how backend/.env
with production DB and Cloudinary credentials ended up served over HTTPS. An
excludelist would fail again the first time a new file lands in the repo root,
so publish an explicit allowlist of docroot paths and mirror it with rsync
--delete.

Includes four guards: every allowlisted path exists, nothing secret-shaped is
allowlisted, publishable content contains no credential assignments, and
scripts/check-assets.mjs passes. Dry run by default; --apply to publish."
```

---

### Task 7: Rewrite `README.md`

`README.md` currently documents MongoDB, Netlify functions, `npm run seed`, `config/`, `models/`, `scripts/seed-db.js`, and `/api/content` endpoints. None exist. It misdirects the next reader and even points at `.agent/workflows/deploy-netlify.md` for deployment.

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the reality established in Tasks 1-6.
- Produces: a README that matches the tree it documents.

- [ ] **Step 1: Replace the content**

Write `README.md` as:

```markdown
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

Two files sit at the repo root because **Neon data rows** reference them, not
because any file in the repo does:

- `resume.pdf` — `profile.resume_url`
- `684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png` — `profile.hero_image`

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
DATABASE_URL=            # Neon Postgres connection string
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
```

- [ ] **Step 2: Verify no stale claim survives**

```bash
cd /home/ace/Projects/Portfolio-webpage
grep -niE "mongo|netlify|seed-db|/api/content|netlify\.toml" README.md && echo "FAIL: stale reference" || echo "OK: no stale references"
```

Expected: `OK: no stale references`.

- [ ] **Step 3: Verify every path the README names actually exists**

```bash
cd /home/ace/Projects/Portfolio-webpage
for p in index.html graphic-design.html photography.html software-development.html js/app.js admin assets backend db/neon_setup.sql scripts/check-assets.mjs scripts/deploy.sh resume.pdf; do
  [ -e "$p" ] || echo "MISSING but documented: $p"
done; echo "README path check complete"
```

Expected: no `MISSING` lines. Then commit:

```bash
cd /home/ace/Projects/Portfolio-webpage
git add README.md
git commit -m "docs: rewrite README to match the current stack

The previous README documented MongoDB, Netlify functions, npm run seed, and
config/, models/, and scripts/ directories that do not exist, and pointed at a
Netlify+MongoDB deploy workflow for a backend that runs on an EC2 host with
Neon Postgres. Replaced with the real layout, dev commands, env vars, and the
allowlist deploy, including why two root files cannot be moved."
```

---

### Task 8: Update `AGENTS.md`

`AGENTS.md` was written before the restructure and now contradicts it. Its "API URL is hardcoded twice → Render" section is exactly the bug Task 1 fixed, and it describes the old root layout.

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: the final tree from Tasks 3-5 and the deploy workflow from Task 6.
- Produces: the agent-facing instruction file, accurate against the new tree.

- [ ] **Step 1: Replace the deployment and layout sections**

Replace the "The README and .agent/ are obsolete", "API URL is hardcoded twice", and "Commands" sections with:

```markdown
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
- `README.md` and `.agent/workflows/deploy-netlify.md` describe MongoDB and
  Netlify. Both are obsolete — the stack is Neon Postgres on an EC2 host.

## Never move these

- **The four HTML pages.** `sitemap.xml` publishes them at the domain root and
  every cross-page link is root-absolute (`/graphic-design.html`, `/#work`).
- **`favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png`, `robots.txt`,
  `sitemap.xml`** — referenced root-absolute by the pages.
- **`hero-optimized.webp`** — root-absolute `og:image` and the `js/app.js` fallback.
- **`resume.pdf` and `684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png`** — referenced by
  Neon rows `profile.resume_url` and `profile.hero_image`, not by any repo file.
  `node scripts/check-assets.mjs` asserts both, precisely because nothing else would.

Adding a new page or asset means adding it to `PUBLISH` in `scripts/deploy.sh`.

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
```

- [ ] **Step 2: Fix the two facts the restructure invalidated**

In the "Env vars" section, `dotenv` still loads from `backend/.env` — unchanged, keep it. In the "Content is DB-driven" section, keep as-is; the renderers are untouched.

Delete the now-obsolete claim in the old "API URL is hardcoded twice" section that production used Render, and replace it with:

```markdown
## API URL

`js/app.js` and `admin/admin.js` each define `API_URL` as a hostname ternary:
`localhost`/`127.0.0.1` → `http://localhost:5000/api`, everything else → `/api`.
There is no env or config mechanism, so changing the backend host means editing
**both** files. Any non-localhost hostname therefore hits the live site and the
live database — never test on a LAN IP, preview domain, or tunnel.
```

- [ ] **Step 3: Note why four orphaned logos are kept**

Append to the "Database" section:

```markdown
`logoNGcodeX.png`, `yibs.png`, `digimark.jpeg`, and `ets_nhahealthtech_logo.jpeg`
have no HTML reference and are absent from the live database, but `db/neon_setup.sql`
seeds `journey.logo_url` with those bare filenames. Keep them so a fresh seed does
not 404.
```

- [ ] **Step 4: Verify no stale claim survives**

```bash
cd /home/ace/Projects/Portfolio-webpage
grep -n "onrender" AGENTS.md && echo "FAIL: stale Render claim" || echo "OK: no stale Render claim"
grep -nE "hardcoded twice" AGENTS.md && echo "FAIL: stale section" || echo "OK: section replaced"
```

- [ ] **Step 5: Commit**

```bash
cd /home/ace/Projects/Portfolio-webpage
git add AGENTS.md
git commit -m "docs: update AGENTS.md for the restructured tree

The API URL section documented the Render URL that no longer exists, and the
layout predates assets/, db/, and scripts/. Adds the deployment topology (the
API runs from a separate clone on the host, unsupervised), the never-move list
with the reason for each entry, and the deploy workflow."
```

---

### Task 9: Deploy and verify the live site

Everything so far is local. This task publishes and proves the site still works.

**Files:** none modified.

**Interfaces:**
- Consumes: `scripts/deploy.sh` (Task 6), `scripts/check-assets.mjs` (Task 2).
- Produces: a published site matching the repo, verified by HTTP status and by the data-pinned files surviving.

- [ ] **Step 1: Pre-flight**

```bash
cd /home/ace/Projects/Portfolio-webpage
node scripts/check-assets.mjs
git status --short   # must be empty
git log --oneline -9
```

Expected: checker green, clean tree, 8 task commits on `chore/repo-restructure`.

- [ ] **Step 2: Review the dry run before touching production**

```bash
cd /home/ace/Projects/Portfolio-webpage
./scripts/deploy.sh
```

Read the itemised list. Expect **deletions** of the files leaving the docroot: `README.md`, `package.json`, `package-lock.json`, `initial_data.sql`, `neon_setup.sql`, `supabase_setup.sql`, `supabase_update.sql`, `data/`, and the 15 deleted images. Expect **creations** under `assets/`, and modifications to `index.html`, `graphic-design.html`, `photography.html`, `js/app.js`, `admin/`.

**Do not proceed if the dry run shows any `.env`, `backend/`, or `*.sql` being created or copied.** That would mean the allowlist is wrong.

- [ ] **Step 3: Publish**

```bash
cd /home/ace/Projects/Portfolio-webpage
./scripts/deploy.sh --apply
```

- [ ] **Step 4: Confirm the docroot matches the allowlist**

```bash
timeout 60 ssh -i /home/ace/MamaSafeKeyPair.pem -o StrictHostKeyChecking=no ubuntu@13.49.191.50 'ls -1 /var/www/chestlyace/'
```

Expected: exactly the allowlist. No `README.md`, no `package.json`, no `backend`, no `*.sql`, no `data`.

- [ ] **Step 5: Verify every public URL**

```bash
for p in / /graphic-design.html /photography.html /software-development.html /admin/ \
         /favicon.ico /favicon-32x32.png /apple-touch-icon.png /robots.txt /sitemap.xml \
         /resume.pdf /hero-optimized.webp \
         /assets/img/69059dfc-d514-4861-b68a-3de1b6f12b58.png \
         /assets/img/wa_logo.jpeg \
         /assets/og/graphic-design-og.webp /assets/og/photography-og.webp \
         /js/app.js /admin/admin.js; do
  printf "%-58s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://chestlyace.online$p")"
done
```

Expected: `200` on every line.

- [ ] **Step 6: Verify nothing sensitive is reachable**

```bash
for p in /backend/.env /.env /.git/config /README.md /package.json /neon_setup.sql \
         /supabase_setup.sql /data/content.json /btc.png /assets/img/../backend/.env; do
  printf "%-58s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://chestlyace.online$p")"
done
```

Expected: `404` on every line — **especially `/README.md` and `/neon_setup.sql`**, which were public before this deploy.

- [ ] **Step 7: Verify the data-pinned files and the API**

```bash
curl -s --max-time 20 https://chestlyace.online/api/portfolio \
  | grep -oE '"(resume_url|hero_image)":"[^"]*"'
curl -s -o /dev/null -w "api/portfolio -> %{http_code}\n" --max-time 15 https://chestlyace.online/api/portfolio
```

Expected: `resume.pdf` and the `684d5ff7-….png` hero, unchanged, with a `200` status. If `resume_url` or `hero_image` came back empty, the rows are damaged — stop and restore from `/var/backups/chestlyace/`.

- [ ] **Step 8: Confirm renewal still works after publishing**

```bash
timeout 220 ssh -i /home/ace/MamaSafeKeyPair.pem -o StrictHostKeyChecking=no ubuntu@13.49.191.50 \
  'sudo certbot renew --cert-name chestlyace.online --dry-run --no-random-sleep-on-renew 2>&1 | tail -6'
```

Expected: `all simulated renewals succeeded`. (Skip `--no-random-sleep-on-renew` only if you accept a multi-minute wait; do not run a bare `certbot renew --dry-run` without it, since it sleeps randomly per certificate and will appear to hang.)

- [ ] **Step 9: Visual check in a browser**

Load `https://chestlyace.online/` and confirm: hero image renders, nav and footer logos show, the WhatsApp QR appears in Contact, the Resume button downloads, the Skills/Projects/Designs/Events/Journey sections populate from the API, and all three subpages render with their nav. Then open `/admin/`, log in, and confirm a profile edit saves.

This is the only step that catches a *visual* regression the status checks cannot — a wrong `src` that still returns `200` for a different file, or a missing element class. If anything is blank, check the browser console: a renamed selector throws inside `fetchPortfolioData`'s `try/catch` and looks like an API outage.

- [ ] **Step 10: Merge**

```bash
cd /home/ace/Projects/Portfolio-webpage
git checkout main && git merge --ff-only chore/repo-restructure
git push origin main
git checkout chore/repo-restructure
```

Only after Steps 5-9 are green. If the user prefers to deploy from the server's own clone (`/home/ubuntu/apps/Portfolio-webpage`, currently 4 files ahead of `main` with the same `/api` fix), reconcile that first — do not leave two divergent copies.

---

## Self-Review

**Spec coverage:** every spec section maps to a task — drift fix (T1), moves (T3, T4), deletions (T4, T5), deploy allowlist (T6), README (T7), AGENTS.md (T8), verification (T9). The already-applied security remediation is recorded in Global Constraints and deliberately not re-done. Out-of-scope items (process supervision, CORS/auth, approach C, history rewrite, sibling-app audit) are listed in the spec and correctly absent here.

**Placeholder scan:** no TBD/TODO. Every code block contains runnable content. The `defer-section`/masonry details and the `showSection` toggling behaviour are untouched and correctly left alone.

**Type/interface consistency:** `scripts/check-assets.mjs` is created in T2 and consumed by T3, T4, T5, T6, T9 — the path and exit-code contract match at every use. `PUBLISH` (T6) matches the docroot listed in T4/T5 and the never-move list in T8. `PINNED_BY_DATA` (T2) matches the two files asserted in T5 Step 2 and T9 Step 7.
