#!/bin/sh
# Fail-hard guards for the tempo-x402 soul service.
#
# Purpose
# -------
# Soul writes all long-lived state to /data:
#   /data/soul.db               — sqlite: weights, beliefs, goals, cycles, plans
#   /data/soul_memory.md        — persistent memory
#   /data/brain_checkpoints/    — transformer/brain checkpoints
#   /data/benchmark_history/    — past eval runs
#   /data/cartridges/           — generated code
#   /data/workspace/            — tools/codegen workspace
#
# If /data is NOT a persistent volume mount, that state lives on the
# container's ephemeral disk and is wiped on every restart / redeploy /
# crash. This script refuses to start soul in that case so that a
# silent data-loss configuration can never ship again.
#
# Backstop for the platform-level `requiredMountPath: /data` in
# railway.json — if someone changes the mount path or disables the
# check, this script still fails fast.
#
# Routing
# -------
# x402-node (Rust) listens on PORT (default 4024, internal).
# nginx listens on PUBLIC_PORT (default 4023, external) and maps:
#   GET /  → /soul/status   (soul cognitive state for Borg Dashboard)
#   *      → x402-node as-is

set -eu

DATA_DIR=/data

if ! awk -v p="${DATA_DIR}" '$2 == p { found=1; exit } END { exit !found }' /proc/mounts; then
  echo "FATAL: ${DATA_DIR} is not a mount point." >&2
  echo "Attach a persistent volume at ${DATA_DIR} before deploying this service." >&2
  echo "Soul would otherwise write weights/beliefs/goals/cycles to ephemeral disk and lose them on restart." >&2
  exit 1
fi

# Fix volume ownership — Railway mounts volumes as root. Running as root
# here allows us to create required runtime directories and chown them before
# dropping privileges.
mkdir -p \
  "${DATA_DIR}/workspace" \
  "${DATA_DIR}/brain_checkpoints" \
  "${DATA_DIR}/benchmark_history" \
  "${DATA_DIR}/cartridges" \
  "${DATA_DIR}/cargo"

chown -R agent:agent "${DATA_DIR}"

# Resolve ports — honour env overrides, fall back to defaults.
INTERNAL_PORT="${PORT:-4024}"
EXTERNAL_PORT="${PUBLIC_PORT:-4023}"

# Write a runtime nginx config that substitutes the actual port values.
# This avoids hard-coding ports in the static nginx.conf while keeping
# the config file simple (no Lua / envsubst dependency).
NGINX_RUNTIME_CONF=/tmp/nginx-runtime.conf
sed \
  -e "s/127\.0\.0\.1:4024/127.0.0.1:${INTERNAL_PORT}/g" \
  -e "s/listen 4023/listen ${EXTERNAL_PORT}/g" \
  /etc/nginx/nginx.conf > "${NGINX_RUNTIME_CONF}"

# Start nginx in the background (runs as root — it only needs to bind the
# port and proxy; no privileged operations after that).
nginx -c "${NGINX_RUNTIME_CONF}" -g "daemon off;" &
NGINX_PID=$!

echo "nginx started (pid ${NGINX_PID}) on port ${EXTERNAL_PORT}, proxying to x402-node on port ${INTERNAL_PORT}"

# Drop privileges and start x402-node on the internal port.
# gosu exec-replaces the shell so signals propagate correctly.
exec gosu agent x402-node "$@"
