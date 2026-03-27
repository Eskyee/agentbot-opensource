#!/usr/bin/env bash
# check-secrets.sh — scan for secrets before pushing to the public repo
# Usage: bash scripts/check-secrets.sh [path]
# Exits 1 if any secret patterns are found.

set -euo pipefail

SCAN_PATH="${1:-.}"
FAIL=0

red()   { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }

echo ""
echo "=== Secret Scanner ==="
echo "Scanning: $SCAN_PATH"
echo ""

check() {
  local label="$1"
  local pattern="$2"
  local exclude="${3:-__NONE__}"

  results=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
                  --include="*.jsx" --include="*.env*" --include="*.json" \
                  --include="*.sh" --include="*.yml" --include="*.yaml" \
                  --include="*.md" \
                  -E "$pattern" "$SCAN_PATH" 2>/dev/null \
    | grep -v "node_modules" \
    | grep -v "\.next" \
    | grep -v "check-secrets\.sh" \
    | grep -v "sync-to-opensource\.sh" \
    | grep -v "SYNC\.md" \
    | { [[ "$exclude" == "__NONE__" ]] && cat || grep -Ev "$exclude"; } \
    || true)

  if [[ -n "$results" ]]; then
    red "FAIL [$label]"
    echo "$results" | head -20
    echo ""
    FAIL=1
  else
    green "  OK  [$label]"
  fi
}

# ── Personal emails ─────────────────────────────────────────────────────────
check "personal gmail"   "[a-zA-Z0-9._%+-]+@gmail\.com" \
  "(example@|your@|user@|test@|YOUR_ADMIN)"

check "personal icloud"  "[a-zA-Z0-9._%+-]+@icloud\.com" \
  "YOUR_ADMIN"

check "personal domains" "(rbasefm|djescaba|eskyjunglelab|raveculture)@" \
  "YOUR_ADMIN"

# ── Private infrastructure URLs ─────────────────────────────────────────────
check "railway URLs"       "\.up\.railway\.app" \
  "YOUR_SOUL_SERVICE_URL"

check "private subdomains" "borg-[0-9]+-production" \
  "YOUR_SOUL_SERVICE_URL"

# ── Personal payment wallet in .env.example ──────────────────────────────────
# We only flag the X402_PAY_TO= pattern with a real 40-char address.
# Public token contract addresses (token/page.tsx, basefm/page.tsx etc.) are
# intentional blockchain data — not personal secrets.
check ".env payment wallet" "X402_PAY_TO=0x[0-9a-fA-F]{40}" \
  "YOUR_WALLET_ADDRESS"

# ── Real API keys ────────────────────────────────────────────────────────────
check "re_ resend key"    "re_[A-Za-z0-9]{20,}"
check "sk- openai key"    "sk-[A-Za-z0-9]{20,}"
check "telegram bot token" "[0-9]{8,}:AA[A-Za-z0-9_-]{30,}" \
  "YOUR_TELEGRAM_BOT_TOKEN"

echo ""
if [[ $FAIL -eq 1 ]]; then
  red "Secrets found — do NOT push to the public repo without fixing these."
  exit 1
else
  green "All clear — no secrets detected."
  exit 0
fi
