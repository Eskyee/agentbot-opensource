#!/usr/bin/env bash
# sync-to-opensource.sh — safely mirror private repo to public repo with secrets stripped
#
# Usage:
#   bash scripts/sync-to-opensource.sh
#
# What it does:
#   1. Checks the working tree is clean
#   2. Runs check-secrets.sh first to catch anything missed
#   3. Rsyncs the repo into a temp dir, applying secret-stripping transforms
#   4. Commits and pushes to the public repo remote
#
# Prerequisites:
#   git remote add opensource https://github.com/Eskyee/agentbot-opensource.git
#   (only needs to be done once)

set -euo pipefail

PRIVATE_ROOT="$(git rev-parse --show-toplevel)"
PUBLIC_REMOTE="opensource"
TEMP_DIR="$(mktemp -d)"
BRANCH="${1:-main}"

red()   { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
info()  { printf '\033[0;36m%s\033[0m\n' "$*"; }

cleanup() { rm -rf "$TEMP_DIR"; }
trap cleanup EXIT

echo ""
info "=== Agentbot → Public Sync ==="
echo ""

# ── 1. Check remote exists ───────────────────────────────────────────────────
if ! git remote get-url "$PUBLIC_REMOTE" &>/dev/null; then
  red "Remote '$PUBLIC_REMOTE' not found."
  echo "Add it once with:"
  echo "  git remote add opensource https://github.com/Eskyee/agentbot-opensource.git"
  exit 1
fi

# ── 2. Run secret scanner first ──────────────────────────────────────────────
info "Running secret scanner on private repo first..."
if ! bash "$PRIVATE_ROOT/scripts/check-secrets.sh" "$PRIVATE_ROOT/web"; then
  red "Secret scan found issues in private repo. Fix before syncing."
  exit 1
fi
echo ""

# ── 3. Clone public repo into temp dir ───────────────────────────────────────
info "Cloning public repo into temp dir..."
PUBLIC_URL="$(git remote get-url "$PUBLIC_REMOTE")"
git clone --depth=1 --branch "$BRANCH" "$PUBLIC_URL" "$TEMP_DIR" 2>/dev/null \
  || git clone --depth=1 "$PUBLIC_URL" "$TEMP_DIR"

# ── 4. Rsync private → temp, excluding secrets and build artifacts ────────────
info "Syncing files (excluding secrets and build artifacts)..."
rsync -av --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='.env.*.local' \
  --exclude='*.log' \
  "$PRIVATE_ROOT/" "$TEMP_DIR/"

# ── 5. Strip secrets in-place ────────────────────────────────────────────────
info "Stripping secrets from synced files..."

strip() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  # Personal emails → env var reads
  sed -i '' \
    -e "s/eskyjunglelab@gmail\.com/\${process.env.ADMIN_EMAIL_1 || ''}/g" \
    -e "s/admin@agentbot\.raveculture\.xyz/\${process.env.ADMIN_EMAIL_2 || ''}/g" \
    -e "s/rbasefm@icloud\.com/\${process.env.ADMIN_EMAIL_3 || ''}/g" \
    -e "s/raveculture@icloud\.com/\${process.env.ADMIN_EMAIL_3 || ''}/g" \
    "$file" 2>/dev/null || true
  # Railway infra URL → env var
  sed -i '' \
    -e "s|https://borg-0-production\.up\.railway\.app|${SOUL_SERVICE_URL:-\${process.env.NEXT_PUBLIC_SOUL_SERVICE_URL || ''}}|g" \
    "$file" 2>/dev/null || true
}

# Files that contain hardcoded personal data
strip "$TEMP_DIR/web/app/onboard/page.tsx"
strip "$TEMP_DIR/web/app/api/provision/route.ts"
strip "$TEMP_DIR/web/app/api/partner/route.ts"
strip "$TEMP_DIR/web/app/api/bankr/prompt/route.ts"
strip "$TEMP_DIR/web/app/api/bankr/balances/route.ts"
strip "$TEMP_DIR/web/app/components/DashboardSidebar.tsx"

# Fix .env.example placeholders
ENV_EXAMPLE="$TEMP_DIR/web/.env.example"
if [[ -f "$ENV_EXAMPLE" ]]; then
  sed -i '' \
    -e "s|X402_PAY_TO=0x[0-9a-fA-F]\{40\}|X402_PAY_TO=0xYOUR_WALLET_ADDRESS_HERE|g" \
    -e "s|SOUL_SERVICE_URL=https://borg-0-production\.up\.railway\.app|SOUL_SERVICE_URL=https://YOUR_SOUL_SERVICE_URL|g" \
    "$ENV_EXAMPLE"
fi

# Remove HARDCODED_ADMINS fallback array entirely from provision route
PROVISION="$TEMP_DIR/web/app/api/provision/route.ts"
if [[ -f "$PROVISION" ]]; then
  # Replace the HARDCODED_ADMINS line with a comment
  sed -i '' \
    -e "s|const HARDCODED_ADMINS = \[.*\]|const HARDCODED_ADMINS: string[] = [] // set ADMIN_EMAILS env var instead|g" \
    "$PROVISION"
fi

# ── 6. Run secret scanner on the stripped output ─────────────────────────────
info "Running secret scanner on stripped output..."
if ! bash "$PRIVATE_ROOT/scripts/check-secrets.sh" "$TEMP_DIR/web"; then
  red "Secrets still found after stripping. Aborting push."
  echo "Inspect the temp dir: $TEMP_DIR"
  trap - EXIT   # don't clean up so you can inspect
  exit 1
fi
echo ""

# ── 7. Commit and push ───────────────────────────────────────────────────────
cd "$TEMP_DIR"
git config user.email "$(cd "$PRIVATE_ROOT" && git config user.email)"
git config user.name "$(cd "$PRIVATE_ROOT" && git config user.name)"

COMMIT_MSG="sync: $(cd "$PRIVATE_ROOT" && git log -1 --pretty='%h %s')"
git add -A
if git diff --cached --quiet; then
  green "No changes to sync — public repo is already up to date."
else
  git commit -m "$COMMIT_MSG"
  git push origin "$BRANCH"
  green "✓ Synced to $PUBLIC_URL ($BRANCH)"
fi
