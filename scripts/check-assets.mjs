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
 * Exit 0 = all references resolve. Exit 1 = at least one is missing, or the
 * build output this script reads is missing entirely.
 *
 * Covered: src/href attributes and og:image/og:url meta tags across the five
 * published HTML files (the four pages Next exports into out/, plus the
 * hand-written admin/index.html), every <loc> in public/sitemap.xml, and the
 * two files referenced by database rows.
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
// out/. Testing it against the repo root would check build inputs that are
// never served while missing the artifact that is.
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
// from out/ (their hand-written twins in the repo root are build inputs, not
// artifacts), while admin/index.html is still hand-written and published from
// admin/, so its relative refs (`admin.js?v=...`) must resolve against admin/.
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
 * the hero image is referenced by nothing else at all. Neither file sits at
 * the repo root anymore -- they live in public/, which the build copies into
 * out/ -- so they are asserted here, in public/, where the check stays
 * meaningful even before a build exists. Moving either 404s the live resume
 * button and hero image until the database rows are updated.
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
const OWN_ORIGIN = /^https?:\/\/(?:www\.)?chestlyace\.online/;

const problems = [];
// Per-bucket counts so the summary can say what was actually checked instead
// of one lump total that hides which rule fired.
const counts = { html: 0, sitemap: 0, pinned: 0 };

function check(sourceRel, ref, absTarget, bucket) {
  counts[bucket]++;
  if (!existsSync(absTarget)) {
    problems.push(`  ${sourceRel}\n    ref:     ${ref}\n    missing: ${relative(REPO_ROOT, absTarget)}`);
  }
}

/**
 * A `/...` reference is a document-root reference, and the document root is
 * out/ no matter which page contains it. A relative reference resolves against
 * the directory of the file containing it -- which is what keeps
 * admin/index.html pointing at admin/admin.js rather than at out/admin.js.
 */
function resolveRef(fromDir, ref) {
  return ref.startsWith('/') ? join(DOCROOT, ref) : resolve(fromDir, ref);
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
    problems.push(`  ${sourceRel}\n    missing: the source file itself (stale or partial build?)`);
    continue;
  }

  const html = readFileSync(abs, 'utf8');
  const fromDir = dirname(abs);

  for (const match of html.matchAll(ATTR)) {
    const original = match[1].trim();
    if (!original) continue;

    let ref = original.replace(OWN_ORIGIN, '');
    if (OPAQUE.test(ref)) continue;

    ref = ref.split('#')[0].split('?')[0];
    if (!ref || ref === '/') continue;

    check(sourceRel, original, resolveRef(fromDir, ref), 'html');
  }

  for (const match of html.matchAll(OG)) {
    const original = match[1].trim();
    if (!original) continue;

    const ref = original.replace(OWN_ORIGIN, '');
    if (OPAQUE.test(ref)) continue;

    const path = ref.split('#')[0].split('?')[0];
    if (!path || path === '/') continue;

    check(sourceRel, original, resolveRef(fromDir, path), 'html');
  }
}

// --- Every <loc> in the sitemap must have a page to serve. ---
// public/sitemap.xml publishes the four pages at the domain root. A <loc> with
// no exported file is exactly the 404 this script exists to prevent, and no
// other check catches it: nothing in out/ links to its own sitemap entries.
if (!existsSync(SITEMAP)) {
  problems.push(`  ${SITEMAP_REL}\n    missing: the sitemap itself`);
} else {
  for (const match of readFileSync(SITEMAP, 'utf8').matchAll(LOC)) {
    const original = match[1].trim();
    if (!original) continue;

    // Same origin-stripping as the meta tags: after it, a sitemap URL is just
    // a document-root-relative path. Anything still holding a scheme points at
    // someone else's origin and is not ours to check.
    const ref = original.replace(OWN_ORIGIN, '');
    if (OPAQUE.test(ref)) continue;

    const path = ref.split('#')[0].split('?')[0];
    // `/` is the exported index page. A trailing slash would need a directory
    // index, which Next's export does not emit, so map it to index.html and
    // let the existence test below report the truth either way.
    const target = !path || path === '/'
      ? 'index.html'
      : path.endsWith('/')
        ? `${path.slice(1)}index.html`
        : path.replace(/^\//, '');

    check(SITEMAP_REL, original, join(DOCROOT, target), 'sitemap');
  }
}

for (const pinned of PINNED_BY_DATA) {
  // Resolve against PUBLIC_DIR: existsSync() on a bare relative path would test
  // against process.cwd(), so this would fail no matter where the script is run.
  check('(database row)', pinned, join(PUBLIC_DIR, pinned), 'pinned');
}

const total = counts.html + counts.sitemap + counts.pinned;

if (problems.length) {
  console.error(`FAIL: ${problems.length} unresolved reference(s) of ${total} checked\n`);
  console.error(problems.join('\n\n'));
  process.exit(1);
}

console.log(`OK: ${counts.html} src/href/og references resolve across ${SOURCES.length} published HTML files`);
console.log(`OK: ${counts.sitemap} sitemap <loc> URL(s) resolve to files in out/`);
console.log(`OK: ${counts.pinned} data-pinned files present in public/`);
