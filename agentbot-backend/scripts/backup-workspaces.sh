#!/bin/bash
# Agent Workspace Backup — Railway Volume + External Storage
# Backs up each user's OpenClaw workspace to a backup volume,
# then optionally syncs to S3/R2 if configured.
set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
DATA_DIR="${AGENTBOT_DATA_DIR:-/tmp/agentbot-data}"
BACKUP_DIR="${AGENTBOT_BACKUP_DIR:-/tmp/agentbot-backups}"
BACKUP_VOLUME="${AGENTBOT_BACKUP_VOLUME:-/mnt/agentbot-backups}"
KEEP_DAYS=7
DATE=$(date +%Y%m%d-%H%M%S)

# External storage (optional — set these env vars to enable)
S3_BUCKET="${AGENTBOT_BACKUP_S3_BUCKET:-}"
S3_ENDPOINT="${AGENTBOT_BACKUP_S3_ENDPOINT:-}"  # For R2: https://<account>.r2.cloudflarestorage.com
S3_REGION="${AGENTBOT_BACKUP_S3_REGION:-us-east-1}"
AWS_ACCESS_KEY_ID="${AGENTBOT_BACKUP_AWS_KEY:-}"
AWS_SECRET_ACCESS_KEY="${AGENTBOT_BACKUP_AWS_SECRET:-}"

# ── Logging ─────────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR" "$BACKUP_VOLUME"
LOG_FILE="$BACKUP_DIR/backup-$DATE.log"

log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG_FILE"; }
error() { echo "[$(date +%H:%M:%S)] ERROR: $*" | tee -a "$LOG_FILE" >&2; }

# ── Backup Workspaces ──────────────────────────────────────────────────────
backup_workspaces() {
    local count=0
    local total_bytes=0

    if [ ! -d "$DATA_DIR" ]; then
        error "Data dir $DATA_DIR does not exist"
        return 1
    fi

    for user_dir in "$DATA_DIR"/*/; do
        [ -d "$user_dir" ] || continue
        local user_id=$(basename "$user_dir")
        
        # Skip non-user dirs
        case "$user_id" in
            backups|tmp|.*) continue ;;
        esac

        local workspace="$user_dir/workspace"
        local config="$user_dir/config"

        if [ ! -d "$workspace" ]; then
            log "SKIP: $user_id (no workspace dir)"
            continue
        fi

        local workspace_size=$(du -sb "$workspace" 2>/dev/null | cut -f1)

        if [ "${workspace_size:-0}" -lt 1 ]; then
            log "SKIP: $user_id (empty workspace)"
            continue
        fi

        local archive="$BACKUP_VOLUME/workspace-${user_id}-${DATE}.tar.gz"

        log "Backing up $user_id ($(numfmt --to=iec ${workspace_size} 2>/dev/null || echo "${workspace_size}B") workspace)..."

        # Archive workspace + config, exclude heavy/irrecoverable files
        tar czf "$archive" \
            --exclude='node_modules' \
            --exclude='.git' \
            --exclude='*.log' \
            --exclude='__pycache__' \
            --exclude='.cache' \
            --exclude='.tmp' \
            -C "$user_dir" \
            workspace config 2>> "$LOG_FILE" || {
            error "Failed to archive $user_id"
            rm -f "$archive"
            continue
        }

        local archive_size=$(stat -f%z "$archive" 2>/dev/null || stat -c%s "$archive" 2>/dev/null)
        total_bytes=$((total_bytes + archive_size))
        count=$((count + 1))
        log "OK: $user_id → $archive ($(numfmt --to=iec ${archive_size} 2>/dev/null || echo "${archive_size}B"))"
    done

    log "Local backup: $count users, $(numfmt --to=iec ${total_bytes} 2>/dev/null || echo "${total_bytes}B") total"
    echo "$count" > "$BACKUP_VOLUME/.last-count"
}

# ── Sync to External Storage ───────────────────────────────────────────────
sync_to_cloud() {
    if [ -z "$S3_BUCKET" ]; then
        log "Cloud sync: skipped (no S3_BUCKET configured)"
        return 0
    fi

    # Check if we have the right tool
    if command -v aws &>/dev/null; then
        log "Cloud sync: uploading to s3://$S3_BUCKET/agentbot-backups/ via aws cli..."
        local endpoint_flag=""
        [ -n "$S3_ENDPOINT" ] && endpoint_flag="--endpoint-url $S3_ENDPOINT"

        AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
        AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
        aws s3 sync "$BACKUP_VOLUME" \
            "s3://$S3_BUCKET/agentbot-backups/$DATE/" \
            $endpoint_flag \
            --region "$S3_REGION" \
            --exclude ".*" \
            --exclude "*.log" \
            2>> "$LOG_FILE" && {
            log "Cloud sync: OK"
        } || {
            error "Cloud sync: FAILED (aws cli error)"
        }
    elif command -v rclone &>/dev/null; then
        log "Cloud sync: uploading via rclone..."
        rclone copy "$BACKUP_VOLUME" "r2:agentbot-backups/$DATE/" \
            --exclude ".*" --exclude "*.log" \
            2>> "$LOG_FILE" && {
            log "Cloud sync: OK"
        } || {
            error "Cloud sync: FAILED (rclone error)"
        }
    else
        error "Cloud sync: no tool available (install aws cli or rclone)"
        return 1
    fi
}

# ── Prune Old Backups ──────────────────────────────────────────────────────
prune_old() {
    log "Pruning local backups older than $KEEP_DAYS days..."
    local pruned=$(find "$BACKUP_VOLUME" -name "workspace-*.tar.gz" -mtime +$KEEP_DAYS -delete -print 2>/dev/null | wc -l | tr -d ' ')
    log "Pruned $pruned old local backups"
}

# ── Summary ────────────────────────────────────────────────────────────────
summary() {
    local count=$(cat "$BACKUP_VOLUME/.last-count" 2>/dev/null || echo "0")
    local backup_size=$(du -sh "$BACKUP_VOLUME" 2>/dev/null | cut -f1)
    local archive_count=$(ls -1 "$BACKUP_VOLUME"/workspace-*.tar.gz 2>/dev/null | wc -l | tr -d ' ')
    
    log "=== Summary ==="
    log "  Users backed up: $count"
    log "  Archives: $archive_count"
    log "  Total size: ${backup_size:-unknown}"
    log "  Cloud: ${S3_BUCKET:-not configured}"
    log "=== Done ==="
}

# ── Main ───────────────────────────────────────────────────────────────────
log "=== Agent Workspace Backup — $DATE ==="
backup_workspaces
sync_to_cloud
prune_old
summary
echo "$LOG_FILE"
