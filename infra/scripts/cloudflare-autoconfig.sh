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

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: Required command not found: $cmd"
    exit 1
  fi
}

require_var() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "ERROR: Missing required variable: $name"
    exit 1
  fi
}

cf_api() {
  local method="$1"
  local endpoint="$2"
  local data="${3:-}"

  if [[ -n "$data" ]]; then
    curl -sS -X "$method" "https://api.cloudflare.com/client/v4${endpoint}" \
      -H "Authorization: Bearer ${CF_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data "$data"
  else
    curl -sS -X "$method" "https://api.cloudflare.com/client/v4${endpoint}" \
      -H "Authorization: Bearer ${CF_API_TOKEN}" \
      -H "Content-Type: application/json"
  fi
}

assert_success() {
  local response="$1"
  local label="$2"
  local ok
  ok="$(echo "$response" | jq -r '.success // false')"
  if [[ "$ok" != "true" ]]; then
    echo "ERROR: Cloudflare API failure for ${label}"
    echo "$response" | jq .
    exit 1
  fi
}

upsert_record() {
  local type="$1"
  local name="$2"
  local content="$3"
  local proxied="$4"

  local query resp existing_id payload result action
  query="/zones/${CF_ZONE_ID}/dns_records?type=${type}&name=${name}"
  resp="$(cf_api GET "$query")"
  assert_success "$resp" "lookup ${type} ${name}"

  existing_id="$(echo "$resp" | jq -r '.result[0].id // empty')"
  payload="$(jq -n --arg type "$type" --arg name "$name" --arg content "$content" --argjson proxied "$proxied" '{type:$type,name:$name,content:$content,proxied:$proxied,ttl:1}')"

  if [[ -n "$existing_id" ]]; then
    action="update"
    result="$(cf_api PUT "/zones/${CF_ZONE_ID}/dns_records/${existing_id}" "$payload")"
  else
    action="create"
    result="$(cf_api POST "/zones/${CF_ZONE_ID}/dns_records" "$payload")"
  fi

  assert_success "$result" "${action} ${type} ${name}"
  echo "✅ ${action}: ${type} ${name} -> ${content} (proxied=${proxied})"
}

main() {
  require_cmd curl
  require_cmd jq

  require_var "CF_API_TOKEN or CLOUDFLARE_API_TOKEN" "$CF_API_TOKEN"
  require_var "CF_ZONE_ID or CLOUDFLARE_ZONE_ID" "$CF_ZONE_ID"
  require_var "SERVER_IP" "$SERVER_IP"

  echo "Configuring Cloudflare DNS records for zone ${CF_ZONE_ID}"
  echo "Frontend host: ${FRONTEND_HOST}"
  echo "API host: ${API_HOST}"
  echo "Agents wildcard host: ${AGENTS_WILDCARD_HOST}"

  upsert_record "CNAME" "$FRONTEND_HOST" "$VERCEL_TARGET" true

  if [[ "$ADD_WWW" == "1" ]]; then
    upsert_record "CNAME" "$WWW_HOST" "$VERCEL_TARGET" true
  fi

  upsert_record "A" "$API_HOST" "$SERVER_IP" false
  upsert_record "A" "$AGENTS_WILDCARD_HOST" "$SERVER_IP" false

  echo ""
  echo "Done. Next checks:"
  echo "- https://${FRONTEND_HOST}"
  echo "- https://${API_HOST}/health"
}

main "$@"
