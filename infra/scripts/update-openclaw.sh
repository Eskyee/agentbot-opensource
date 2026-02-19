#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
IMAGE="${OPENCLAW_IMAGE:-ghcr.io/openclaw/openclaw:latest}"
BACKUP_ROOT="${BACKUP_ROOT:-./runtime-data/backups/openclaw-updates}"
WAIT_SECONDS="${WAIT_SECONDS:-12}"

usage() {
  cat <<EOF
Usage:
  $0 <instance-id|container-name|--all> [image]

Examples:
  $0 64d4ef3e8ee82cbe
  $0 openclaw-64d4ef3e8ee82cbe ghcr.io/openclaw/openclaw:latest
  $0 --all

Environment variables:
  OPENCLAW_IMAGE   Default image to upgrade to (default: ghcr.io/openclaw/openclaw:latest)
  BACKUP_ROOT      Backup folder root (default: ./runtime-data/backups/openclaw-updates)
  WAIT_SECONDS     Seconds to wait before health check (default: 12)
EOF
}

if [[ -z "$TARGET" ]]; then
  usage
  exit 1
fi

if [[ -n "${2:-}" ]]; then
  IMAGE="$2"
fi

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

resolve_containers() {
  if [[ "$TARGET" == "--all" ]]; then
    docker ps --format '{{.Names}}' | grep '^openclaw-' || true
    return
  fi

  if [[ "$TARGET" == openclaw-* ]]; then
    echo "$TARGET"
  else
    echo "openclaw-$TARGET"
  fi
}

backup_volume() {
  local volume_name="$1"
  local backup_file="$2"

  mkdir -p "$(dirname "$backup_file")"
  docker run --rm \
    -v "$volume_name":/data:ro \
    -v "$(dirname "$backup_file")":/backup \
    alpine sh -lc "tar czf /backup/$(basename "$backup_file") -C /data ."
}

run_update() {
  local container="$1"

  if ! docker inspect "$container" >/dev/null 2>&1; then
    log "SKIP: $container not found"
    return 0
  fi

  local running
  running="$(docker inspect -f '{{.State.Running}}' "$container")"
  if [[ "$running" != "true" ]]; then
    log "SKIP: $container is not running"
    return 0
  fi

  local instance_id old_image host_port mount_type mount_name source_path memory cpus
  instance_id="${container#openclaw-}"
  old_image="$(docker inspect -f '{{.Config.Image}}' "$container")"
  host_port="$(docker inspect -f '{{(index (index .NetworkSettings.Ports "18789/tcp") 0).HostPort}}' "$container")"
  mount_type="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/home/node/.openclaw"}}{{.Type}}{{end}}{{end}}' "$container")"
  mount_name="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/home/node/.openclaw"}}{{.Name}}{{end}}{{end}}' "$container")"
  source_path="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/home/node/.openclaw"}}{{.Source}}{{end}}{{end}}' "$container")"
  memory="$(docker inspect -f '{{.HostConfig.Memory}}' "$container")"
  cpus="$(docker inspect -f '{{.HostConfig.NanoCpus}}' "$container")"

  if [[ -z "$host_port" ]]; then
    log "ERROR: could not determine host port for $container"
    return 1
  fi

  local timestamp backup_file
  local mount_args=()
  timestamp="$(date +%Y%m%d-%H%M%S)"
  backup_file="$BACKUP_ROOT/$instance_id/$timestamp.tar.gz"

  if [[ "$mount_type" == "volume" && -n "$mount_name" ]]; then
    log "Backing up volume $mount_name -> $backup_file"
    backup_volume "$mount_name" "$backup_file"
    mount_args=(-v "$mount_name:/home/node/.openclaw")
  elif [[ "$mount_type" == "bind" && -n "$source_path" ]]; then
    log "Creating bind-path backup $source_path -> $backup_file"
    mkdir -p "$(dirname "$backup_file")"
    tar czf "$backup_file" -C "$source_path" .
    mount_args=(-v "$source_path:/home/node/.openclaw")
  else
    log "ERROR: could not determine data mount for $container"
    return 1
  fi

  log "Pulling new image: $IMAGE"
  docker pull "$IMAGE" >/dev/null

  log "Stopping and removing $container"
  docker stop "$container" >/dev/null
  docker rm "$container" >/dev/null

  local run_args=(
    -d
    --name "$container"
    --restart unless-stopped
    -p "$host_port:18789"
  )

  if [[ "$memory" != "0" ]]; then
    run_args+=(--memory "$memory")
  fi

  if [[ "$cpus" != "0" ]]; then
    # Convert NanoCPUs back to decimal CPUs
    local cpu_decimal
    cpu_decimal="$(awk -v n="$cpus" 'BEGIN { printf "%.3f", n/1000000000 }')"
    run_args+=(--cpus "$cpu_decimal")
  fi

  if ! docker run "${run_args[@]}" "${mount_args[@]}" "$IMAGE" >/dev/null; then
    log "ERROR: failed to start with new image, attempting rollback"
    docker run "${run_args[@]}" "${mount_args[@]}" "$old_image" >/dev/null || true
    return 1
  fi

  sleep "$WAIT_SECONDS"

  if ! docker inspect -f '{{.State.Running}}' "$container" | grep -q true; then
    log "ERROR: new container is not running, rolling back"
    docker rm -f "$container" >/dev/null 2>&1 || true
    docker run "${run_args[@]}" "${mount_args[@]}" "$old_image" >/dev/null || true
    return 1
  fi

  log "SUCCESS: $container updated"
  log "- old image: $old_image"
  log "- new image: $IMAGE"
  log "- backup: $backup_file"
}

main() {
  local containers
  containers="$(resolve_containers)"

  if [[ -z "$containers" ]]; then
    log "No matching running OpenClaw containers found"
    exit 0
  fi

  local failed=0
  while IFS= read -r container; do
    [[ -z "$container" ]] && continue
    if ! run_update "$container"; then
      failed=1
    fi
  done <<< "$containers"

  if [[ "$failed" -ne 0 ]]; then
    log "One or more updates failed"
    exit 1
  fi

  log "All requested updates completed"
}

main
