#!/usr/bin/env node
/**
 * Post-process the Next.js static export.
 *
 * Two jobs:
 *
 *  1. Assert the four expected documents exist. A clean segment name
 *     (`app/graphic-design/`) makes Next emit `out/graphic-design.html`,
 *     which nginx serves at the existing URL with no rewrite. Verified
 *     empirically against Next 16.3.8. If that ever stops being true this
 *     script fails loudly instead of publishing a 404.
 *
 *  2. Delete the RSC payload litter (`out/*.txt`, `out/__next.*.txt`,
 *     `out/<route>/`). Verified safe: all pages still hydrate and log zero
 *     console errors without it, because every internal link is a plain
 *     <a> tag and never <Link>. Step 3 is what makes step 2 safe to run
 *     automatically rather than on trust.
 */
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(REPO_ROOT, 'out');

const REQUIRED = [
  'index.html',
  'graphic-design.html',
  'photography.html',
  'software-development.html',
];

if (!existsSync(OUT)) {
  console.error('FAIL: out/ does not exist — run `next build` first.');
  process.exit(1);
}

const missing = REQUIRED.filter((f) => !existsSync(join(OUT, f)));
if (missing.length) {
  console.error(
    `FAIL: expected export documents are missing:\n${missing
      .map((m) => `  out/${m}`)
      .join('\n')}\n` +
      'If a route was named `graphic-design.html`, Next emits ' +
      '`graphic-design.html.html` AND a colliding payload directory. ' +
      'The route folder must be named `graphic-design` with no extension.',
  );
  process.exit(1);
}

// --- Delete the payload litter. ---
const removed = [];

function isPayloadFile(name) {
  return name.endsWith('.txt');
}

function isPayloadDir(name) {
  if (name === '_next' || name === '404.html' || name === '_not-found.html') {
    return false;
  }
  // Payload dirs are named after their route and contain only __next.*.txt
  // files. Route directories never do, because routes emit .html files.
  const full = join(OUT, name);
  if (!statSync(full).isDirectory()) return false;
  const entries = readdirSync(full);
  return (
    entries.length > 0 && entries.every((e) => e.startsWith('__next.'))
  );
}

for (const entry of readdirSync(OUT)) {
  const full = join(OUT, entry);
  if (isPayloadDir(entry) || isPayloadFile(entry)) {
    rmSync(full, { recursive: true, force: true });
    removed.push(entry);
  }
}

// --- Prove the deletion was safe: no surviving file may reference a
// --- removed path. Fail loudly rather than publish a broken reference.
const dangling = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(html|js|css|json|txt)$/.test(entry)) continue;
    const body = readFileSync(full, 'utf8');
    for (const gone of removed) {
      if (body.includes(`/${gone}`) || body.includes(`"${gone}"`)) {
        dangling.push(`${full.replace(`${REPO_ROOT}/`, '')} references ${gone}`);
      }
    }
  }
}
walk(OUT);

if (dangling.length) {
  console.error(
    `FAIL: ${dangling.length} file(s) reference deleted export payloads:\n` +
      dangling.map((d) => `  ${d}`).join('\n') +
      '\nEither internal navigation started using <Link>, or a payload is ' +
      'actually needed. Restore it rather than publishing.',
  );
  process.exit(1);
}

console.log(`OK: ${REQUIRED.length} export documents present`);
console.log(`OK: removed ${removed.length} payload artifact(s): ${removed.join(', ') || 'none'}`);
console.log('OK: no surviving reference to a removed artifact');
