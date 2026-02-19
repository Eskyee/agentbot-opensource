#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="${REPORT_DIR:-./runtime-data/release-reports}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
REPORT_FILE="${REPORT_DIR}/prod-go-live-${TIMESTAMP}.log"
LATEST_FILE="${REPORT_DIR}/latest.log"

mkdir -p "$REPORT_DIR"

echo "=== OpenClawDeploy Production Go-Live Report ===" | tee "$REPORT_FILE"
echo "Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')" | tee -a "$REPORT_FILE"
echo "Frontend: ${FRONTEND_URL:-https://agentbot.raveculture.xyz}" | tee -a "$REPORT_FILE"
echo "API: ${API_URL:-https://api.agentbot.raveculture.xyz}" | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"

set +e
./infra/scripts/prod-go-live-check.sh 2>&1 | tee -a "$REPORT_FILE"
CHECK_EXIT=${PIPESTATUS[0]}
set -e

echo | tee -a "$REPORT_FILE"
if [[ "$CHECK_EXIT" -eq 0 ]]; then
  echo "RESULT: PASS" | tee -a "$REPORT_FILE"
else
  echo "RESULT: FAIL" | tee -a "$REPORT_FILE"
fi

cp "$REPORT_FILE" "$LATEST_FILE"

echo "Saved report: $REPORT_FILE"
echo "Latest report: $LATEST_FILE"

exit "$CHECK_EXIT"
