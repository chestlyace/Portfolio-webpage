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
