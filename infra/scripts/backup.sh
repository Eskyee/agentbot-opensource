#!/bin/bash
# Agentbot Daily Backup Script
# Backs up all user OpenClaw data to Google Cloud Storage

set -e

BACKUP_DIR="/backups"
GCS_BUCKET="gs://agentbot-backups"
DATE=$(date +%Y-%m-%d)
LOG_FILE="/var/log/agentbot-backup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log "Starting daily backup..."

# Get all OpenClaw containers
CONTAINERS=$(docker ps --filter "name=openclaw-" --format "{{.Names}}" 2>/dev/null || echo "")

if [ -z "$CONTAINERS" ]; then
    log "No OpenClaw containers found"
    exit 0
fi

BACKUP_COUNT=0
ERROR_COUNT=0

for container in $CONTAINERS; do
    USER_ID=${container#openclaw-}
    VOLUME_NAME="${container}-data"
    BACKUP_FILE="${USER_ID}-${DATE}.tar.gz"
    
    log "Backing up $USER_ID..."
    
    # Check if volume exists
    if ! docker volume inspect "$VOLUME_NAME" &>/dev/null; then
        # Try alternative volume naming
        VOLUME_NAME="openclaw-${USER_ID}"
        if ! docker volume inspect "$VOLUME_NAME" &>/dev/null; then
            log "WARNING: Volume not found for $USER_ID, skipping"
            ((ERROR_COUNT++))
            continue
        fi
    fi
    
    # Create backup
    if docker run --rm \
        -v "${VOLUME_NAME}":/data:ro \
        -v "$BACKUP_DIR":/backup \
        alpine tar czf "/backup/${BACKUP_FILE}" -C /data . 2>/dev/null; then
        
        # Upload to GCS
        if gsutil -q cp "$BACKUP_DIR/${BACKUP_FILE}" "$GCS_BUCKET/${USER_ID}/" 2>/dev/null; then
            log "SUCCESS: $USER_ID backed up to GCS"
            ((BACKUP_COUNT++))
        else
            log "ERROR: Failed to upload $USER_ID to GCS"
            ((ERROR_COUNT++))
        fi
    else
        log "ERROR: Failed to create backup for $USER_ID"
        ((ERROR_COUNT++))
    fi
done

# Cleanup old local backups (keep 7 days)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null || true

log "Backup complete: $BACKUP_COUNT successful, $ERROR_COUNT errors"

# Exit with error if any backups failed
[ $ERROR_COUNT -eq 0 ] || exit 1
