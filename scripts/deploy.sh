#!/usr/bin/env bash
#
# Publish the site to the nginx document root.
#
#   npm run build                 # REQUIRED FIRST: this publishes out/
#   ./scripts/deploy.sh           # dry run: print what would change, change nothing
#   ./scripts/deploy.sh --apply   # publish for real
#
# The published set comes from a build, not from the repo root: `npm run build`
# writes the complete static site into out/, and this script copies out/'s
# contents to the document root. Deploying without rebuilding publishes a
# STALE site -- whatever the last build produced -- so always build first.
#
# This uses an ALLOWLIST, not an excludelist, on purpose. The document root is
# served to the entire internet, and an excludelist fails the moment a new file
# appears in the repo -- including a .env. Only the paths below are ever
# published, so anything else in the repo is private by construction.
#
# Two exceptions to that guarantee, both deliberate and both covered by the
# guards rather than by the allowlist: `public/` is copied wholesale into out/
# by the build, and `out/` itself is one unit. See the note on PUBLISH below.
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

# Scratch file for Guard 3's matches. Created up front because the guard runs
# under `set -e`, and a redirect cannot create it later.
SECRET_HITS="$(mktemp)"

# --- The allowlist. Adding a new published path means adding a line here. ---
# out/ is the build output and is validated as a unit rather than entry by
# entry: every file in it came from public/ or from a page render, and
# scripts/check-assets.mjs proves the references inside it resolve. admin/ is
# the one hand-maintained directory that still ships as-is -- it has no build
# step and is served directly. Nothing else in the repo is publishable.
#
# The unit of trust is now the directory, not the entry: `next build` copies all
# of public/ into out/ verbatim, dotfiles included, so a secret committed under
# public/ would be published by this script. Guards 2 and 3 below are what keep
# that from happening -- Guard 2 rejects unsafe path names and Guard 3 greps the
# staged tree -- so `public/` is covered by inspection rather than by
# construction. Keep new secrets out of public/.
PUBLISH=(
  out
  admin
)

# --- Guard 1: every allowlisted path must exist, so a typo fails loudly. ---
for p in "${PUBLISH[@]}"; do
  if [ ! -e "$REPO_ROOT/$p" ]; then
    echo "ERROR: allowlisted path does not exist: $p" >&2
    exit 1
  fi
done

# --- Guard 2: refuse to publish anything that could carry a secret. ---
# Two passes. The first is the allowlist names themselves. The second is the
# file NAMES inside the published trees, which matters because the unit of trust
# is now the directory: `next build` copies all of public/ into out/ verbatim,
# so `public/backup.sql` would otherwise be published with no allowlist entry
# anywhere near it.
for p in "${PUBLISH[@]}"; do
  case "$p" in
    backend|data|*.env|*.sql|*.log|*.bak*)
      echo "ERROR: unsafe path in PUBLISH allowlist: $p" >&2
      exit 1
      ;;
  esac
done

UNSAFE_NAMES=$(find "$REPO_ROOT/out" "$REPO_ROOT/admin" \
  \( -name '*.env' -o -name '.env*' -o -name '*.sql' -o -name '*.log' -o -name '*.bak*' \
     -o -name '*.pem' -o -name 'id_rsa*' -o -name '*.key' \) -print 2>/dev/null)
if [ -n "$UNSAFE_NAMES" ]; then
  echo "ERROR: files with unsafe names inside the published set:" >&2
  printf '  %s\n' "$UNSAFE_NAMES" >&2
  exit 1
fi

# --- Guard 3: scan publishable content for credential-shaped assignments. ---
# out/ is generated, so this guard is really checking that no build input
# leaked a credential into a page or into the copied assets: -r walks the whole
# tree (built HTML, chunks, and everything copied up from public/). It still
# earns its place, because a server component or a public/ file can carry a
# value through into the export.
#
# -h so symlinks are not followed out of the tree, and the result is captured
# before testing: under `set -o pipefail` an inline `grep -q .` is decided by
# whichever grep exits first, so a SIGPIPE from the first grep can mask a hit.
if grep -rlEh '(DATABASE_URL|JWT_SECRET|ADMIN_PASSWORD|CLOUDINARY_API_SECRET)[[:space:]]*=' \
     "$REPO_ROOT/out" "$REPO_ROOT/admin" 2>/dev/null > "$SECRET_HITS"; then
  echo "ERROR: credential-shaped content found in publishable paths:" >&2
  sed 's/^/  /' "$SECRET_HITS" >&2
  exit 1
fi

# --- Guard 4: local asset integrity must be green before publishing. ---
if ! node "$REPO_ROOT/scripts/check-assets.mjs"; then
  echo "ERROR: asset check failed - not deploying" >&2
  exit 1
fi

# --- Stage only the allowlist, so --delete mirrors exactly this set. ---
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE" "$SECRET_HITS"' EXIT
for p in "${PUBLISH[@]}"; do
  if [ "$p" = "out" ]; then
    # Copy out/'s CONTENTS to the staged root: the document root IS out/.
    # Copying the directory itself would nest the site at
    # /var/www/chestlyace/out/index.html and 404 every URL on the domain. The
    # "/." form copies what is inside the directory, dotfiles included.
    cp -a "$REPO_ROOT/out/." "$STAGE/"
  else
    # Everything else keeps the plain directory copy, so admin/ lands at
    # /admin/ rather than being flattened to the docroot.
    cp -a "$REPO_ROOT/$p" "$STAGE/"
  fi
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
