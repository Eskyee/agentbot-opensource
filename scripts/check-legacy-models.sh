#!/bin/bash
# Warn when changed files reference legacy snake_case Prisma models.
#
# Intentionally non-blocking: this exists to draw a reviewer's eye when new
# code reaches for the legacy schema. Some legacy-touching changes are
# legitimate (bug fixes inside the existing basefm/bridge/ops pipelines), so
# the script always exits 0 — see docs/SCHEMA_MIGRATION.md for the full rule.

set -u

LEGACY_MODELS="prisma\.(agents|users|wallets|bookings|deployments|events|royalty_splits|social_campaigns|treasury_transactions|model_metrics|dj_sessions|bridge_messages)"

# Pick a comparison range:
#   - In a CI PR run, GITHUB_BASE_REF / GITHUB_SHA are set.
#   - Locally, fall back to HEAD~1 when available, else "no base" → no-op.
RANGE=""
if [ -n "${GITHUB_BASE_REF:-}" ] && [ -n "${GITHUB_SHA:-}" ]; then
  git fetch --no-tags --depth=1 origin "$GITHUB_BASE_REF" 2>/dev/null || true
  RANGE="origin/${GITHUB_BASE_REF}...${GITHUB_SHA}"
elif git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
  RANGE="HEAD~1...HEAD"
fi

if [ -z "$RANGE" ]; then
  echo "check-legacy-models: no comparison range available — skipping"
  exit 0
fi

CHANGED=$(git diff --name-only "$RANGE" -- '*.ts' '*.tsx' 2>/dev/null || true)
if [ -z "$CHANGED" ]; then
  echo "check-legacy-models: no changed TS files in range $RANGE"
  exit 0
fi

VIOLATIONS=$(echo "$CHANGED" | xargs -r grep -lE "$LEGACY_MODELS" 2>/dev/null || true)
if [ -n "$VIOLATIONS" ]; then
  echo "::warning::Changed files reference legacy snake_case Prisma models:"
  echo "$VIOLATIONS" | sed 's/^/  - /'
  echo
  echo "Prefer PascalCase models (User, Agent, …) for new code, or wrap legacy"
  echo "reads in app/lib/legacyUserId.ts-style helpers. See docs/SCHEMA_MIGRATION.md"
  echo "for the rule and the list of currently-active legacy models."
  exit 0
fi

echo "check-legacy-models: no new legacy model usage in range $RANGE"
exit 0
