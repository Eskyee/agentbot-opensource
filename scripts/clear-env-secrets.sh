#!/bin/bash
# clear-env-secrets.sh — Remove sensitive values from .env after bootstrap/deploy
# Usage: ./scripts/clear-env-secrets.sh [--dry-run]
#
# This script clears sensitive environment variables from .env files
# after they've been consumed by bootstrap or deployment scripts.
# Inspired by 1Claw's zero-secret runtime pattern.

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "[dry-run] Would clear secrets from .env files"
fi

ENV_FILES=(
  ".env"
  ".env.local"
  ".env.production"
)

# Patterns for sensitive keys that should be cleared after use
SECRET_PATTERNS=(
  "CDP_API_KEY_PRIVATE_KEY"
  "STRIPE_SECRET_KEY"
  "NEXT_AUTH_SECRET"
  "OPENAI_API_KEY"
  "RESEND_API_KEY"
  "MOLTX_API_KEY"
  "MIMO_API_KEY"
  "BANKR_API_KEY"
)

cleared=0

for env_file in "${ENV_FILES[@]}"; do
  if [[ -f "$env_file" ]]; then
    for pattern in "${SECRET_PATTERNS[@]}"; do
      if grep -q "^${pattern}=" "$env_file" 2>/dev/null; then
        if $DRY_RUN; then
          echo "[dry-run] Would clear: $pattern in $env_file"
        else
          # Replace the value with empty, keep the key
          sed -i '' "s/^${pattern}=.*/${pattern}=/" "$env_file"
          echo "[cleared] $pattern in $env_file"
        fi
        ((cleared++))
      fi
    done
  fi
done

if [[ $cleared -eq 0 ]]; then
  echo "[ok] No secrets found to clear"
else
  echo "[done] Cleared $cleared secret(s)"
fi
