#!/bin/sh
set -eu

AUTH_KEY="${TAILSCALE_AUTHKEY:-${TS_AUTHKEY:-}}"
if [ -z "$AUTH_KEY" ]; then
  exit 0
fi

if ! command -v tailscaled >/dev/null 2>&1 || ! command -v tailscale >/dev/null 2>&1; then
  echo "TAILSCALE_AUTHKEY is set, but tailscale binaries are not installed in this image." >&2
  exit 1
fi

STATE_DIR="${TAILSCALE_STATE_DIR:-${TS_STATE_DIR:-/var/lib/tailscale}}"
SOCKS_ADDR="${TAILSCALE_SOCKS5_SERVER:-127.0.0.1:1055}"
HTTP_PROXY_ADDR="${TAILSCALE_OUTBOUND_HTTP_PROXY_LISTEN:-127.0.0.1:1055}"
HOSTNAME="${TAILSCALE_HOSTNAME:-agentbot-${AGENTBOT_USER_ID:-agent}}"
ACCEPT_ROUTES="${TAILSCALE_ACCEPT_ROUTES:-true}"
EXTRA_ARGS="${TAILSCALE_EXTRA_ARGS:-}"

mkdir -p "$STATE_DIR" /var/run/tailscale

echo "[$(date)] Starting Tailscale userspace networking as ${HOSTNAME}..."
tailscaled \
  --tun=userspace-networking \
  --socks5-server="$SOCKS_ADDR" \
  --outbound-http-proxy-listen="$HTTP_PROXY_ADDR" \
  --state="${STATE_DIR}/tailscaled.state" &

for _ in $(seq 1 30); do
  if [ -S /var/run/tailscale/tailscaled.sock ]; then
    break
  fi
  sleep 1
done

set -- up \
  --auth-key="$AUTH_KEY" \
  --hostname="$HOSTNAME" \
  "--accept-routes=$ACCEPT_ROUTES"

if [ -n "${TAILSCALE_TAGS:-}" ]; then
  set -- "$@" --advertise-tags="$TAILSCALE_TAGS"
fi

if [ -n "$EXTRA_ARGS" ]; then
  # shellcheck disable=SC2086
  set -- "$@" $EXTRA_ARGS
fi

tailscale "$@"
tailscale status --self || true
echo "[$(date)] Tailscale ready. SOCKS5/HTTP proxy: ${SOCKS_ADDR}"
