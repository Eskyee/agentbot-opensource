#!/usr/bin/env bash
# sync-to-opensource.sh — safely mirror private repo to public repo with secrets stripped
#
# Usage:
#   bash scripts/sync-to-opensource.sh [branch]
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
  echo "  git remote add opensource https://github.com/Eskyee/agentbot-opensource.git"
  exit 1
fi

# ── 2. Clone public repo into temp dir ───────────────────────────────────────
# No pre-scan of private repo — it intentionally contains personal emails.
# We only scan the STRIPPED output before pushing.
info "Cloning public repo..."
PUBLIC_URL="$(git remote get-url "$PUBLIC_REMOTE")"
git clone --depth=1 --branch "$BRANCH" "$PUBLIC_URL" "$TEMP_DIR" 2>/dev/null \
  || git clone --depth=1 "$PUBLIC_URL" "$TEMP_DIR" 2>/dev/null \
  || { git init "$TEMP_DIR"; git -C "$TEMP_DIR" remote add origin "$PUBLIC_URL"; }

# ── 3. Rsync private → temp ──────────────────────────────────────────────────
info "Syncing files..."
rsync -a --delete \
  --exclude='.git' \
  --exclude='.claude/' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='.env.*.local' \
  --exclude='*.log' \
  --exclude='web/.github/' \
  --exclude='x402-tempo/' \
  \
  `# ── Internal-only files/dirs — not for public contributors ──────────` \
  --exclude='AUDIT-*.md' \
  --exclude='AUDIT_REPORT_*.md' \
  --exclude='SESSION_NOTES.md' \
  --exclude='TASKS.md' \
  --exclude='SECRETS.md' \
  --exclude='SECRETS_CHECKLIST.md' \
  --exclude='CODE_REVIEW.md' \
  --exclude='*.docx' \
  --exclude='dashboard.html' \
  --exclude='memory/' \
  --exclude='.claire/' \
  --exclude='CLAUDE.md' \
  "$PRIVATE_ROOT/" "$TEMP_DIR/"

# ── 4. Strip secrets globally ────────────────────────────────────────────────
info "Stripping secrets..."

# Run sed globally across all text files in the synced output
strip_all() {
  local pattern="$1"
  local replacement="$2"
  local dir="${3:-$TEMP_DIR}"
  find "$dir" -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
       -o -name "*.sh" -o -name "*.yml" -o -name "*.yaml" \
       -o -name "*.md" -o -name ".env.example" \) \
    ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/.git/*" \
    -exec sed -i '' -e "s|$pattern|$replacement|g" {} \; 2>/dev/null || true
}

# Personal emails
strip_all 'eskyjunglelab@gmail\.com'           'YOUR_ADMIN_EMAIL_1'
strip_all 'rbasefm@icloud\.com'                'YOUR_ADMIN_EMAIL_2'
strip_all 'raveculture@icloud\.com'            'YOUR_ADMIN_EMAIL_3'
strip_all 'admin@agentbot\.raveculture\.xyz'   'YOUR_ADMIN_EMAIL_4'
strip_all 'djescaba@icloud\.com'               'YOUR_ADMIN_EMAIL_5'

# Private infrastructure URLs — strip ALL *YOUR_SERVICE_URL hostnames
strip_all 'https://[a-zA-Z0-9_-]*\.up\.railway\.app' 'https://YOUR_SERVICE_URL'
strip_all '[a-zA-Z0-9_-]*\.up\.railway\.app'          'YOUR_SERVICE_URL'

# Telegram bot tokens (real tokens match \d{8,}:AA[A-Za-z0-9_-]{30,})
strip_all '[0-9]\{8,\}:AA[A-Za-z0-9_-]\{30,\}' 'YOUR_TELEGRAM_BOT_TOKEN'

# Personal payment wallet address (global — catches skills/monetize-service.md etc.)
strip_all '0xYOUR_WALLET_ADDRESS_HERE' '0xYOUR_WALLET_ADDRESS_HERE'
strip_all '0xYOUR_WALLET_ADDRESS_HERE' '0xYOUR_WALLET_ADDRESS_HERE'

# Personal payment wallet in .env.example only
ENV_EXAMPLE="$TEMP_DIR/web/.env.example"
if [[ -f "$ENV_EXAMPLE" ]]; then
  sed -i '' \
    -e 's|X402_PAY_TO=0x[0-9a-fA-F]*|X402_PAY_TO=0xYOUR_WALLET_ADDRESS_HERE|g' \
    -e 's|SOUL_SERVICE_URL=https://[^ ]*railway\.app[^ ]*|SOUL_SERVICE_URL=https://YOUR_SOUL_SERVICE_URL|g' \
    "$ENV_EXAMPLE"
fi

# ── 5. Scan stripped output ───────────────────────────────────────────────────
info "Scanning stripped output for leaks..."
if ! bash "$PRIVATE_ROOT/scripts/check-secrets.sh" "$TEMP_DIR"; then
  red "Secrets still found after stripping. Aborting."
  trap - EXIT   # keep temp dir so you can inspect
  exit 1
fi
echo ""

# ── 6. Commit and push ───────────────────────────────────────────────────────
cd "$TEMP_DIR"
git config user.email "$(cd "$PRIVATE_ROOT" && git config user.email)"
git config user.name "$(cd "$PRIVATE_ROOT" && git config user.name)"

COMMIT_MSG="sync: $(cd "$PRIVATE_ROOT" && git log -1 --pretty='%h %s')"
git add -A
if git diff --cached --quiet; then
  green "No changes to sync — public repo is already up to date."
else
  git commit -m "$COMMIT_MSG"
  git push origin "$BRANCH" 2>/dev/null || git push --set-upstream origin "$BRANCH"
  green "✓ Synced to $PUBLIC_URL ($BRANCH)"
fi
