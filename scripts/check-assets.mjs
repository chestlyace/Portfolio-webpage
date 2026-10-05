#!/usr/bin/env node
/**
 * Asset integrity checker.
 *
 * Every src/href in the published HTML must resolve to a real file that will
 * actually be served. Run after any file move to prove no reference was left
 * dangling.
 *
 *   node scripts/check-assets.mjs
 *
 * Exit 0 = all references resolve. Exit 1 = at least one reference does not
 * resolve, a reference points outside the published tree, or an input this script
 * needs is missing (no build output, no sitemap, no checked <loc>).
 *
 * Covered: quoted src/href attributes and og:image/og:url meta tags across the
 * five published HTML files (the four pages Next exports into out/, plus the
 * hand-written admin/index.html), every <loc> in public/sitemap.xml, and the two
 * files referenced by database rows.
 *
 * Not covered: URLs returned by the API at runtime (Cloudinary), and
 * admin/admin.js, which builds URLs from template literals and runtime API
 * values rather than from literal src/href attributes. Its old counterpart
 * js/app.js no longer ships at all, so it is not an offender to name anymore.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The document root is out/ -- the build output -- not the repo root.
// `npm run build` writes a complete site into out/ and deploy.sh publishes
// that directory's contents, so a `/...` reference in a page means a file in
// out/. Testing it against the repo root would check files that are never
// served while missing the artifact that is.
const DOCROOT = join(REPO_ROOT, 'out');
// public/ is the other half of the published set: the build copies it into
// out/ verbatim, so a file must live here to reach the document root at all.
const PUBLIC_DIR = join(REPO_ROOT, 'public');
const SITEMAP_REL = 'public/sitemap.xml';
const SITEMAP = join(PUBLIC_DIR, 'sitemap.xml');

// HTML only. admin/admin.js is deliberately excluded: it builds URLs from
// template literals and runtime API values, so `src="${work.image_url}"`
// matches a naive attribute regex and reports runtime data as missing files.
//
// Each source names its own directory instead of sharing one base, because
// the published set no longer has a single root: the four exported pages ship
// from out/ (the hand-written .html files in the repo root are what they were
// transcribed from -- the app router never reads them, and they are retired at
// the end of the migration), while admin/index.html is still hand-written and
// published from admin/, so its relative refs (`admin.js?v=...`) resolve against
// admin/.
const SOURCES = [
  { file: 'index.html', dir: 'out' },
  { file: 'graphic-design.html', dir: 'out' },
  { file: 'photography.html', dir: 'out' },
  { file: 'software-development.html', dir: 'out' },
  { file: 'index.html', dir: 'admin' },
];

/**
 * Referenced by database rows (profile.resume_url, profile.hero_image).
 * resume.pdf is also the href in the exported index.html, but the client
 * overwrites it at runtime with the row value, so the row is the authority;
 * the hero image is referenced by nothing else at all. Both are asserted in
 * public/, because public/ is the build input the artifact is copied from --
 * a file missing from public/ can never reach out/, so that is the place where
 * absence is the actionable failure. Moving either 404s the live resume button
 * and hero image until the database rows are updated.
 */
const PINNED_BY_DATA = [
  'resume.pdf',
  '684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png',
];

const ATTR = /(?:src|href)\s*=\s*["']([^"']+)["']/g;
// og:image / og:url are carried by `content=`, not `src`/`href`, so they need
// their own pattern or moving an OG image goes completely unchecked.
const OG = /<meta[^>]+property="og:(?:image|image:url|url)"[^>]+content="([^"]+)"/g;
// One <loc> per sitemap entry. The sitemap publishes pages at the domain root,
// and nothing else checks that those URLs have a file behind them.
const LOC = /<loc>\s*([^<]+?)\s*<\/loc>/g;
// Any scheme (https:, mailto:, tel:, data:) or protocol-relative or bare anchor.
const OPAQUE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;
// Absolute URLs on our own domain are really docroot-relative; strip the origin
// so moving an OG image (or dropping a published page) is caught instead of
// silently skipped. Reused for <loc>, which is always an absolute URL.
// The host is bounded by a lookahead for `/`, `?`, `#` or end-of-string, so
// chestlyace.online.evil.com is not mistaken for our own domain.
const OWN_ORIGIN = /^https?:\/\/(?:www\.)?chestlyace\.online(?=[/?#]|$)/i;
// A userinfo component (`https://user:pw@host/`) still puts the real origin in
// front, so strip anything up to and including the last '@' before matching.
const USERINFO = /^https?:\/\/[^/?#]*@/i;

/**
 * Reduce a reference to a document-root path, or return null when it is not
 * ours to check.
 *
 * Two details are deliberate. Origin-stripping is applied to the userinfo-stripped
 * form, so `https://x@chestlyace.online/page.html` is recognised as ours rather
 * than silently skipped. And leading slashes are collapsed, because origin-stripping
 * `https://chestlyace.online//page.html` leaves `//page.html`, which reads as
 * protocol-relative and would be skipped in silence -- costing one checked
 * reference and no warning at all. A genuine protocol-relative URL points at
 * another host, so it stays opaque.
 */
function toDocPath(original) {
  const stripped = original.replace(USERINFO, (m) => m.replace(/[^/]*$/, ''));

  if (OWN_ORIGIN.test(stripped)) {
    // Our own origin, so the remainder is a docroot path -- and only now may
    // leading slashes be collapsed. See below for why that matters.
    return stripped.replace(OWN_ORIGIN, '').replace(/^\/{2,}/, '/');
  }

  // No slash-collapsing here. A `//host/...` URL that is not ours is genuinely
  // protocol-relative: it names another origin, so OPAQUE skips it. Collapsing
  // its slashes would turn a reference to someone else's CDN into a check for
  // out/cdn.example.com/lib.css, which fails on every legitimate external
  // stylesheet and would block a correct deploy.
  return OPAQUE.test(stripped) ? null : stripped;
}

const problems = [];
// Per-bucket counts so the summary can say what was actually checked instead
// of one lump total that hides which rule fired.
const counts = { html: 0, sitemap: 0, pinned: 0 };
// Findings about the checker's inputs rather than about a reference: kept apart
// so the "N of M checked" line stays a truthful ratio.
let extraProblems = 0;

function addInputProblem(sourceRel, detail) {
  extraProblems++;
  problems.push(`  ${sourceRel}\n    problem: ${detail}`);
}

function check(sourceRel, ref, absTarget, bucket) {
  if (!absTarget) {
    // Not counted as a checked reference: it was never tested against a file,
    // so counting it would let "N of M" imply coverage it does not have.
    extraProblems++;
    problems.push(`  ${sourceRel}\n    ref:     ${ref}\n    problem: resolves outside the published tree`);
    return;
  }
  counts[bucket]++;
  if (!existsSync(absTarget)) {
    problems.push(`  ${sourceRel}\n    ref:     ${ref}\n    missing: ${relative(REPO_ROOT, absTarget)}`);
  }
}

/**
 * Resolve a reference the way a browser resolves a URL, not the way a shell
 * resolves a path.
 *
 * The distinction matters, because the two disagree. `/../out/index.html` is a
 * URL that nginx serves as `/out/index.html` -- which is not in the published
 * set and 404s -- while path normalisation would fold it back to out/index.html
 * and pass. So containment is decided on URL segments first, and only a URL that
 * stays inside the document root is ever mapped to a file.
 *
 * `urlDir` is the directory of the containing page *as a URL* (`/` for the pages
 * in out/, `/admin/` for admin/index.html), which is what makes `../index.html`
 * inside admin/ resolve to `/index.html` -- a file that really is published --
 * while `../backend/server.js` resolves outside the root and is rejected.
 */
function resolveRef(urlDir, ref) {
  const segments = ref.startsWith('/') ? [] : urlDir.split('/').filter(Boolean);

  for (const segment of ref.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      // Popping past the document root is an escape, not a path that happens to
      // normalise back into it.
      if (!segments.length) return null;
      segments.pop();
      continue;
    }
    segments.push(segment);
  }

  // URL space to file space. Only admin/ has its own directory at the docroot;
  // every other published path is a file inside out/.
  const path = segments.join('/');
  return path === 'admin' || path.startsWith('admin/')
    ? join(REPO_ROOT, 'admin', path.slice('admin/'.length))
    : join(DOCROOT, path);
}

// --- Refuse to run against a missing or empty build. ---
// A checker that reports "OK: 0 references" because it found nothing to check
// is worse than no checker, so an absent out/index.html is a hard failure with
// the fix named, not a silent pass.
if (!existsSync(join(DOCROOT, 'index.html'))) {
  console.error(
    'FAIL: no build output at out/index.html - run `npm run build` first.\n' +
      'This script checks out/ because out/ is what deploy.sh publishes.',
  );
  process.exit(1);
}

for (const { file, dir } of SOURCES) {
  const sourceRel = `${dir}/${file}`;
  const abs = join(REPO_ROOT, dir, file);

  if (!existsSync(abs)) {
    // The exported pages come and go with the build; a missing one is a stale
    // or partial build, not a broken reference, so report it as such instead
    // of throwing a stack trace out of readFileSync.
    addInputProblem(sourceRel, 'the source file itself is missing (stale or partial build?)');
    continue;
  }

  const html = readFileSync(abs, 'utf8');
  // The containing page's directory *as a URL*, which is not the same as its
  // directory on disk: admin/index.html lives in admin/ on disk but is served
  // from /admin/, so `../index.html` there means the docroot's index.html.
  const urlDir = dir === 'admin' ? '/admin/' : '/';

  for (const match of html.matchAll(ATTR)) {
    const original = match[1].trim();
    if (!original) continue;

    const doc = toDocPath(original);
    if (doc === null) continue;

    const ref = doc.split('#')[0].split('?')[0];
    if (!ref || ref === '/') continue;

    check(sourceRel, original, resolveRef(urlDir, ref), 'html');
  }

  for (const match of html.matchAll(OG)) {
    const original = match[1].trim();
    if (!original) continue;

    const doc = toDocPath(original);
    if (doc === null) continue;

    const path = doc.split('#')[0].split('?')[0];
    if (!path || path === '/') continue;

    check(sourceRel, original, resolveRef(urlDir, path), 'html');
  }
}

// --- Every <loc> in the sitemap must have a page to serve. ---
// public/sitemap.xml publishes the four pages at the domain root. A <loc> with
// no exported file is exactly the 404 this script exists to prevent, and no
// other check catches it: nothing in out/ links to its own sitemap entries.
if (!existsSync(SITEMAP)) {
  addInputProblem(SITEMAP_REL, 'the sitemap itself is missing');
} else {
  for (const match of readFileSync(SITEMAP, 'utf8').matchAll(LOC)) {
    const original = match[1].trim();
    if (!original) continue;

    // Same origin-stripping as the meta tags: after it, a sitemap URL is just
    // a document-root-relative path. Anything still holding a scheme points at
    // someone else's origin and is not ours to check.
    const doc = toDocPath(original);
    if (doc === null) continue;

    const path = doc.split('#')[0].split('?')[0];
    // `/` is the exported index page. A trailing slash would need a directory
    // index, which Next's export does not emit, so map it to index.html and
    // let the existence test below report the truth either way.
    const target = !path || path === '/'
      ? '/index.html'
      : path.endsWith('/')
        ? `${path}index.html`
        : path;

    check(SITEMAP_REL, original, resolveRef("/", target), 'sitemap');
  }

  // An empty or wholly-foreign urlset would report "OK: 0" and exit 0, which is
  // the same vacuous pass the missing-build guard exists to prevent. The sitemap
  // publishing four pages is a known fact about this site, so require it.
  if (counts.sitemap === 0) {
    addInputProblem(SITEMAP_REL, 'no <loc> on our own origin was checked');
  }
}

for (const pinned of PINNED_BY_DATA) {
  // Resolve against PUBLIC_DIR: existsSync() on a bare relative path would test
  // against process.cwd(), so this would fail no matter where the script is run.
  check('(database row)', pinned, join(PUBLIC_DIR, pinned), 'pinned');
}

const total = counts.html + counts.sitemap + counts.pinned;

if (problems.length) {
  // The count of problems is not the count of checked references: the
  // outside-the-tree and no-own-loc entries are findings about the checker
  // inputs, not unchecked references, so they are reported separately rather
  // than inflating "N of M" with something that was never in M.
  const references = problems.length - extraProblems;
  console.error(
    `FAIL: ${references} unresolved reference(s) of ${total} checked` +
      (extraProblems ? `, plus ${extraProblems} input problem(s)\n` : '\n'),
  );
  console.error(problems.join('\n\n'));
  process.exit(1);
}

console.log(`OK: ${counts.html} src/href/og references resolve across ${SOURCES.length} published HTML files`);
console.log(`OK: ${counts.sitemap} sitemap <loc> URL(s) resolve to files in out/`);
console.log(`OK: ${counts.pinned} data-pinned files present in public/`);
