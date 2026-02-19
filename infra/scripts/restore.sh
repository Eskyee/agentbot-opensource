#!/bin/bash
# Agentbot Restore Script
# Restores a user's OpenClaw instance from backup

set -e

usage() {
    echo "Usage: $0 <user_id> [date]"
    echo "  user_id: The user identifier (e.g., user123)"
    echo "  date: Optional backup date (YYYY-MM-DD), defaults to latest"
    exit 1
}

[ -z "$1" ] && usage

USER_ID="$1"
DATE="${2:-latest}"
GCS_BUCKET="gs://agentbot-backups"
TEMP_DIR="/tmp/agentbot-restore"
CONTAINER_NAME="openclaw-${USER_ID}"
VOLUME_NAME="openclaw-${USER_ID}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting restore for $USER_ID..."

# Create temp directory
mkdir -p "$TEMP_DIR"

# Find backup file
if [ "$DATE" = "latest" ]; then
    log "Finding latest backup..."
    BACKUP_FILE=$(gsutil ls "$GCS_BUCKET/${USER_ID}/" 2>/dev/null | sort | tail -1)
    if [ -z "$BACKUP_FILE" ]; then
        log "ERROR: No backups found for $USER_ID"
        exit 1
    fi
else
    BACKUP_FILE="$GCS_BUCKET/${USER_ID}/${USER_ID}-${DATE}.tar.gz"
fi

log "Using backup: $BACKUP_FILE"

# Download backup
log "Downloading backup..."
gsutil cp "$BACKUP_FILE" "$TEMP_DIR/backup.tar.gz"

# Stop existing container if running
if docker ps -q -f "name=$CONTAINER_NAME" | grep -q .; then
    log "Stopping existing container..."
    docker stop "$CONTAINER_NAME"
    docker rm "$CONTAINER_NAME"
fi

# Remove existing volume if it exists
if docker volume inspect "$VOLUME_NAME" &>/dev/null; then
    log "Removing old volume..."
    docker volume rm "$VOLUME_NAME"
fi

# Create new volume
log "Creating new volume..."
docker volume create "$VOLUME_NAME"

# Restore data
log "Restoring data..."
docker run --rm \
    -v "${VOLUME_NAME}":/data \
    -v "$TEMP_DIR":/backup:ro \
    alpine sh -c "cd /data && tar xzf /backup/backup.tar.gz"

# Get next available port (simple approach - check config or use default)
# In production, this would query the database
PORT=$(grep -oP "(?<=$USER_ID:)\d+" /opt/agentbot/port-map.txt 2>/dev/null || echo "18789")

# Start new container
log "Starting container on port $PORT..."
docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -v "${VOLUME_NAME}":/home/node/.openclaw \
    -p "${PORT}:18789" \
    --memory="512m" \
    --cpus="0.5" \
    ghcr.io/openclaw/openclaw:latest

# Cleanup
rm -rf "$TEMP_DIR"

log "SUCCESS: $USER_ID restored and running on port $PORT"
log "Update Caddy config if needed: ${USER_ID}.agentbot.com → localhost:$PORT"
