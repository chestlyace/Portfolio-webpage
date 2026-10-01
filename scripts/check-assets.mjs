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
 * Referenced by Neon data rows (profile.resume_url, profile.hero_image). resume.pdf
 * is also the href in index.html, but js/app.js overwrites it at runtime with the
 * row value, so the row is the authority; the hero image is referenced by nothing
 * else at all. Moving either 404s the live resume button and hero image until the
 * database rows are updated. Asserted here so the constraint is machine-checked
 * rather than tribal knowledge.
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
