#!/usr/bin/env bash
# check-secrets.sh — scan for secrets before pushing to the public repo
# Usage: bash scripts/check-secrets.sh [path]
# Exits 1 if any secret patterns are found.

set -euo pipefail

SCAN_PATH="${1:-.}"
FAIL=0

red()   { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
warn()  { printf '\033[0;33m%s\033[0m\n' "$*"; }

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
                  -E "$pattern" "$SCAN_PATH" 2>/dev/null \
    | grep -v "node_modules" \
    | grep -v "\.next" \
    | grep -v "check-secrets.sh" \
    | grep -v "sync-to-opensource.sh" \
    | { [[ "$exclude" == "__NONE__" ]] && cat || grep -v "$exclude"; } \
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
check "personal gmail"    "[a-zA-Z0-9._%+-]+@gmail\.com" "example@gmail|your@gmail|user@gmail"
check "personal icloud"   "[a-zA-Z0-9._%+-]+@icloud\.com"
check "personal domains"  "(rbasefm|djescaba|eskyjunglelab|raveculture)@"

# ── Real wallet addresses ────────────────────────────────────────────────────
check "wallet address"    "0x[0-9a-fA-F]{40}" "0xYOUR_WALLET|0x000000|0x123456|example|placeholder|USDC|Token|ERC20|parseAbi|address.*function|balanceOf|HARDCODED|wallet.*Address.*=.*'0x[0-9a-fA-F]{8}'"

# ── Private infrastructure URLs ─────────────────────────────────────────────
check "railway URLs"      "\.up\.railway\.app"
check "private subdomains" "borg-[0-9]+-production"

# ── Real API keys ────────────────────────────────────────────────────────────
check "re_ resend key"    "re_[A-Za-z0-9]{20,}"
check "sk- openai key"    "sk-[A-Za-z0-9]{20,}"
check "Bearer hardcoded"  "Bearer [A-Za-z0-9+/]{20,}"

echo ""
if [[ $FAIL -eq 1 ]]; then
  red "Secrets found — do NOT push to the public repo without fixing these."
  exit 1
else
  green "All clear — no secrets detected."
  exit 0
fi
