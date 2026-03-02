#!/usr/bin/env bash
set -euo pipefail

FRONTEND_URL="${FRONTEND_URL:-https://agentbot.raveculture.xyz}"
API_URL="${API_URL:-https://api.agentbot.raveculture.xyz}"
AGENTS_DOMAIN="${AGENTS_DOMAIN:-agents.agentbot.raveculture.xyz}"
CHECK_STRIPE="${CHECK_STRIPE:-1}"
CHECK_ROUTES="${CHECK_ROUTES:-1}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-10}"
USER_AGENT="Atlas-Platform-Operator/1.0 (Verified Agentbot Ops)"

PASS_COUNT=0
FAIL_COUNT=0

red() { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }
yellow() { printf '\033[33m%s\033[0m\n' "$1"; }

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  green "✅ $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  red "❌ $1"
}

info() {
  yellow "ℹ️  $1"
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    fail "Missing required command: $cmd"
    exit 1
  fi
}

http_status() {
  local url="$1"
  curl -sS -o /dev/null -A "$USER_AGENT" -w '%{http_code}' --max-time "$TIMEOUT_SECONDS" "$url" || echo "000"
}

check_200() {
  local label="$1"
  local url="$2"
  local status
  status="$(http_status "$url")"
  if [[ "$status" == "200" ]]; then
    pass "$label ($status)"
  else
    fail "$label (expected 200, got $status) -> $url"
  fi
}

check_route_200() {
  local path="$1"
  check_200 "Route ${path} reachable" "${FRONTEND_URL}${path}"
}

check_dns_resolves() {
  local host="$1"
  local result
  result="$(dig +short "$host" | head -n 1 || true)"
  if [[ -n "$result" ]]; then
    pass "DNS resolves for $host -> $result"
  else
    fail "DNS does not resolve for $host"
  fi
}

check_stripe_redirect() {
  local url="${FRONTEND_URL}/api/stripe/checkout?plan=starter"
  local headers
  headers="$(curl -sS -I --max-time "$TIMEOUT_SECONDS" "$url" || true)"

  if echo "$headers" | grep -qi '^location:.*stripe\.com'; then
    pass "Stripe checkout redirects to Stripe"
    return
  fi

  if echo "$headers" | grep -qi '^location:.*payment_error='; then
    fail "Stripe checkout endpoint reachable but Stripe is not fully configured"
    return
  fi

  fail "Stripe checkout did not return expected redirect"
}

main() {
  require_cmd curl
  require_cmd dig

  info "Production go-live checks"
  info "Frontend: $FRONTEND_URL"
  info "API:      $API_URL"
  info "Agents:   *.${AGENTS_DOMAIN}"

  check_dns_resolves "${FRONTEND_URL#https://}"
  check_dns_resolves "${API_URL#https://}"
  check_dns_resolves "sample.${AGENTS_DOMAIN}"

  check_200 "Frontend home is healthy" "$FRONTEND_URL"
  check_200 "Frontend API health is healthy" "${FRONTEND_URL}/api/health"
  check_200 "Backend API health is healthy" "${API_URL}/api/health"

  if [[ "$CHECK_ROUTES" == "1" ]]; then
    check_route_200 "/signup"
    check_route_200 "/onboard"
    check_route_200 "/marketplace"
    check_route_200 "/docs"
    check_route_200 "/terms"
    check_route_200 "/privacy"
    check_route_200 "/blog"
  fi

  if [[ "$CHECK_STRIPE" == "1" ]]; then
    check_stripe_redirect
  else
    info "Skipping Stripe check (CHECK_STRIPE=0)"
  fi

  echo
  info "Summary: ${PASS_COUNT} passed, ${FAIL_COUNT} failed"

  if [[ "$FAIL_COUNT" -gt 0 ]]; then
    exit 1
  fi
}

main "$@"
