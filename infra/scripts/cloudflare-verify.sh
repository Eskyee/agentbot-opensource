#!/usr/bin/env bash
set -euo pipefail

CF_API_TOKEN="${CF_API_TOKEN:-${CLOUDFLARE_API_TOKEN:-}}"
CF_ZONE_ID="${CF_ZONE_ID:-${CLOUDFLARE_ZONE_ID:-}}"
SERVER_IP="${SERVER_IP:-}"

FRONTEND_HOST="${FRONTEND_HOST:-agentbot.raveculture.xyz}"
API_HOST="${API_HOST:-api.agentbot.raveculture.xyz}"
AGENTS_WILDCARD_HOST="${AGENTS_WILDCARD_HOST:-*.agents.agentbot.raveculture.xyz}"
VERCEL_TARGET="${VERCEL_TARGET:-cname.vercel-dns.com}"
ADD_WWW="${ADD_WWW:-1}"
WWW_HOST="${WWW_HOST:-www.agentbot.raveculture.xyz}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-10}"

PASS=0
FAIL=0

ok() { PASS=$((PASS + 1)); echo "✅ $*"; }
warn() { echo "⚠️  $*"; }
err() { FAIL=$((FAIL + 1)); echo "❌ $*"; }

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || { err "Missing command: $cmd"; exit 1; }
}

cf_api_get() {
  local endpoint="$1"
  curl -sS "https://api.cloudflare.com/client/v4${endpoint}" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json"
}

cf_lookup_record() {
  local type="$1"
  local name="$2"
  cf_api_get "/zones/${CF_ZONE_ID}/dns_records?type=${type}&name=${name}"
}

check_cf_record() {
  local type="$1"
  local name="$2"
  local expected_content="$3"
  local expected_proxied="$4"

  local resp success count content proxied
  resp="$(cf_lookup_record "$type" "$name")"
  success="$(echo "$resp" | jq -r '.success // false')"
  if [[ "$success" != "true" ]]; then
    err "Cloudflare API error looking up ${type} ${name}"
    echo "$resp" | jq .
    return
  fi

  count="$(echo "$resp" | jq -r '.result | length')"
  if [[ "$count" == "0" ]]; then
    err "Record missing: ${type} ${name}"
    return
  fi

  content="$(echo "$resp" | jq -r '.result[0].content // ""')"
  proxied="$(echo "$resp" | jq -r '.result[0].proxied')"

  if [[ "$content" == "$expected_content" ]]; then
    ok "Cloudflare content OK: ${type} ${name} -> ${content}"
  else
    err "Cloudflare content mismatch for ${type} ${name}: expected ${expected_content}, got ${content}"
  fi

  if [[ "$proxied" == "$expected_proxied" ]]; then
    ok "Cloudflare proxy mode OK: ${type} ${name} proxied=${proxied}"
  else
    err "Cloudflare proxy mismatch for ${type} ${name}: expected proxied=${expected_proxied}, got ${proxied}"
  fi
}

http_code() {
  local url="$1"
  curl -sS -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT_SECONDS" "$url" || echo "000"
}

check_http_200() {
  local label="$1"
  local url="$2"
  local code
  code="$(http_code "$url")"
  if [[ "$code" == "200" ]]; then
    ok "$label (${code})"
  else
    err "$label expected 200, got ${code} -> ${url}"
  fi
}

check_dns() {
  local host="$1"
  local expected="$2"
  local resolved
  resolved="$(dig +short "$host" | head -n 1 || true)"
  if [[ -z "$resolved" ]]; then
    err "DNS unresolved: ${host}"
    return
  fi

  if [[ -n "$expected" && "$resolved" != "$expected" ]]; then
    warn "DNS resolved for ${host}: ${resolved} (expected ${expected})"
    ok "DNS resolves for ${host}"
  else
    ok "DNS resolves for ${host}: ${resolved}"
  fi
}

main() {
  require_cmd curl
  require_cmd jq
  require_cmd dig

  echo "Cloudflare verify for zone ${CF_ZONE_ID:-<missing>}"

  if [[ -z "$CF_API_TOKEN" || -z "$CF_ZONE_ID" ]]; then
    err "CF_API_TOKEN/CLOUDFLARE_API_TOKEN and CF_ZONE_ID/CLOUDFLARE_ZONE_ID are required"
    exit 1
  fi

  check_cf_record "CNAME" "$FRONTEND_HOST" "$VERCEL_TARGET" "true"

  if [[ "$ADD_WWW" == "1" ]]; then
    check_cf_record "CNAME" "$WWW_HOST" "$VERCEL_TARGET" "true"
  fi

  if [[ -n "$SERVER_IP" ]]; then
    check_cf_record "A" "$API_HOST" "$SERVER_IP" "false"
    check_cf_record "A" "$AGENTS_WILDCARD_HOST" "$SERVER_IP" "false"
  else
    warn "SERVER_IP not provided; validating A records existence only"
    check_cf_record "A" "$API_HOST" "$(echo "$(cf_lookup_record "A" "$API_HOST")" | jq -r '.result[0].content // ""')" "false"
    check_cf_record "A" "$AGENTS_WILDCARD_HOST" "$(echo "$(cf_lookup_record "A" "$AGENTS_WILDCARD_HOST")" | jq -r '.result[0].content // ""')" "false"
  fi

  check_dns "$FRONTEND_HOST" ""
  check_dns "$API_HOST" "$SERVER_IP"
  check_dns "sample.${AGENTS_WILDCARD_HOST#*.}" "$SERVER_IP"

  check_http_200 "Frontend reachable" "https://${FRONTEND_HOST}"
  check_http_200 "Frontend API health reachable" "https://${FRONTEND_HOST}/api/health"
  check_http_200 "Backend API health reachable" "https://${API_HOST}/health"

  echo ""
  echo "Summary: ${PASS} passed, ${FAIL} failed"

  if [[ "$FAIL" -gt 0 ]]; then
    exit 1
  fi
}

main "$@"
