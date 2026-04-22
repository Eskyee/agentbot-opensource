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

set -eu

DATA_DIR=/data

if ! awk -v p="${DATA_DIR}" '$2 == p { found=1; exit } END { exit !found }' /proc/mounts; then
  echo "FATAL: ${DATA_DIR} is not a mount point." >&2
  echo "Attach a persistent volume at ${DATA_DIR} before deploying this service." >&2
  echo "Soul would otherwise write weights/beliefs/goals/cycles to ephemeral disk and lose them on restart." >&2
  exit 1
fi

if ! PROBE=$(mktemp "${DATA_DIR}/.soul-mount-probe.XXXXXX" 2>/dev/null); then
  echo "FATAL: ${DATA_DIR} is mounted but not writable by uid=$(id -u)." >&2
  exit 1
fi
rm -f "${PROBE}"

mkdir -p "${DATA_DIR}/workspace" "${DATA_DIR}/brain_checkpoints" "${DATA_DIR}/benchmark_history" "${DATA_DIR}/cartridges"

exec x402-node "$@"
