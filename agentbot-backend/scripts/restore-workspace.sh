#!/bin/bash
# Agent Workspace Restore — restore a user's workspace from backup
# Usage: ./restore-workspace.sh <user_id> [backup_date]
#   backup_date format: YYYYMMDD-HHMMSS (defaults to latest)
set -euo pipefail

BACKUP_VOLUME="${AGENTBOT_BACKUP_VOLUME:-/mnt/agentbot-backups}"
DATA_DIR="${AGENTBOT_DATA_DIR:-/tmp/agentbot-data}"

if [ $# -lt 1 ]; then
    echo "Usage: $0 <user_id> [backup_date]"
    echo ""
    echo "Available backups:"
    ls -1t "$BACKUP_VOLUME"/workspace-*.tar.gz 2>/dev/null | sed 's/.*workspace-//' | sed 's/-[0-9]*-[0-9]*.tar.gz//' | sort -u | head -20
    exit 1
fi

USER_ID="$1"
BACKUP_DATE="${2:-}"

# Find the backup to restore
if [ -n "$BACKUP_DATE" ]; then
    ARCHIVE="$BACKUP_VOLUME/workspace-${USER_ID}-${BACKUP_DATE}.tar.gz"
else
    ARCHIVE=$(ls -1t "$BACKUP_VOLUME"/workspace-${USER_ID}-*.tar.gz 2>/dev/null | head -1)
fi

if [ ! -f "$ARCHIVE" ]; then
    echo "ERROR: No backup found for user $USER_ID"
    echo ""
    echo "Available backups for this user:"
    ls -1t "$BACKUP_VOLUME"/workspace-${USER_ID}-*.tar.gz 2>/dev/null || echo "  (none)"
    exit 1
fi

USER_DATA_DIR="$DATA_DIR/$USER_ID"
ARCHIVE_DATE=$(echo "$ARCHIVE" | sed 's/.*workspace-[^-]*-//' | sed 's/.tar.gz//')
ARCHIVE_SIZE=$(du -h "$ARCHIVE" | cut -f1)

echo "=== Workspace Restore ==="
echo "User:    $USER_ID"
echo "Backup:  $ARCHIVE_DATE"
echo "Archive: $ARCHIVE ($ARCHIVE_SIZE)"
echo ""

# Confirm
read -p "Restore will OVERWRITE current workspace. Continue? [y/N] " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Aborted."
    exit 0
fi

# Back up current workspace first (safety net)
if [ -d "$USER_DATA_DIR/workspace" ]; then
    SAFETY_DIR="$DATA_DIR/backups/${USER_ID}-pre-restore-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$SAFETY_DIR"
    cp -r "$USER_DATA_DIR/workspace" "$SAFETY_DIR/" 2>/dev/null || true
    echo "Safety backup: $SAFETY_DIR/workspace"
fi

# Restore
mkdir -p "$USER_DATA_DIR"
tar xzf "$ARCHIVE" -C "$USER_DATA_DIR" 2>/dev/null || {
    echo "ERROR: Failed to extract archive"
    exit 1
}

echo "OK: Restored $USER_ID from $ARCHIVE_DATE backup"
echo "Workspace: $USER_DATA_DIR/workspace"
echo "Config:    $USER_DATA_DIR/config"
