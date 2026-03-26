#!/bin/bash
# Agentbot Container Provisioning System
# Manages on-demand Docker containers for each user's OpenClaw agent
set -euo pipefail

# Configuration
NETWORK_NAME="agentbot-net"
DATA_DIR="${AGENTBOT_DATA_DIR:-/tmp/agentbot-data}"
IMAGE_NAME="${OPENCLAW_IMAGE:-ghcr.io/openclaw/openclaw:2026.3.22}"
MAX_CONTAINERS=${MAX_CONTAINERS:-5}
PORT_BASE=19789
MEMORY_LIMIT="2g"
CPU_LIMIT="2"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)]${NC} $*"; }
error() { echo -e "${RED}[$(date +%H:%M:%S)]${NC} $*"; }

# Ensure network exists
ensure_network() {
    docker network inspect "$NETWORK_NAME" >/dev/null 2>&1 || \
        docker network create --driver bridge "$NETWORK_NAME"
}

# Get next available port
get_next_port() {
    local port=$PORT_BASE
    while docker ps -a --format '{{.Ports}}' 2>/dev/null | grep -q ":${port}->"; do
        ((port++))
    done
    echo $port
}

# Get container resource usage
get_container_stats() {
    local container_name="agentbot-$1"
    if docker inspect "$container_name" >/dev/null 2>&1; then
        docker stats --no-stream --format "CPU:{{.CPUPerc}} MEM:{{.MemUsage}}" "$container_name" 2>/dev/null || echo "unknown"
    else
        echo "stopped"
    fi
}

# List all agent containers
list_containers() {
    log "Agent containers:"
    echo ""
    printf "%-20s %-12s %-10s %-20s %-15s\n" "CONTAINER" "STATUS" "PORT" "MEMORY" "CPU"
    printf "%-20s %-12s %-10s %-20s %-15s\n" "--------" "------" "----" "------" "---"
    
    docker ps -a --filter "name=agentbot-" --format '{{.Names}}|{{.Status}}|{{.Ports}}' | while IFS='|' read -r name status ports; do
        local port=$(echo "$ports" | grep -oE '[0-9]+->' | head -1 | tr -d '->')
        local stats=$(get_container_stats "${name#agentbot-}")
        printf "%-20s %-12s %-10s %-20s %-15s\n" "$name" "$(echo $status | cut -d' ' -f1)" "$port" "$stats"
    done
    echo ""
}

# Create a new agent container
create_container() {
    local user_id="$1"
    local plan="${2:-solo}"
    local provider="${AGENTBOT_AI_PROVIDER:-anthropic}"
    local api_key="${AGENTBOT_API_KEY:-}"
    local container_name="agentbot-$user_id"
    local user_data_dir="$DATA_DIR/$user_id"
    
    # Check if already exists
    if docker inspect "$container_name" >/dev/null 2>&1; then
        warn "Container $container_name already exists"
        return 0
    fi
    
    # Check container limit
    local running_count=$(docker ps --filter "name=agentbot-" --format '{{.Names}}' | wc -l | tr -d ' ')
    if [ "$running_count" -ge "$MAX_CONTAINERS" ]; then
        warn "Container limit reached ($MAX_CONTAINERS). Pausing least recently used..."
        pause_lru_container
    fi
    
    # Set memory based on plan
    case "$plan" in
        solo) MEMORY_LIMIT="2g"; CPU_LIMIT="1" ;;
        collective) MEMORY_LIMIT="4g"; CPU_LIMIT="2" ;;
        label) MEMORY_LIMIT="8g"; CPU_LIMIT="4" ;;
        network) MEMORY_LIMIT="16g"; CPU_LIMIT="4" ;;
        *) MEMORY_LIMIT="2g"; CPU_LIMIT="1" ;;
    esac
    
    # Create user data directory
    mkdir -p "$user_data_dir/workspace"
    mkdir -p "$user_data_dir/config"
    
    # Get next available port
    local port=$(get_next_port)
    
    log "Creating container for user $user_id (plan: $plan)..."
    
    # Create container (not started)
    docker create \
        --name "$container_name" \
        --network "$NETWORK_NAME" \
        --memory "$MEMORY_LIMIT" \
        --cpus "$CPU_LIMIT" \
        --init \
        -p "127.0.0.1:$port:18789" \
        -v "$user_data_dir/workspace:/home/node/.openclaw/workspace" \
        -v "$user_data_dir/config:/home/node/.openclaw" \
        -e "HOME=/home/node" \
        -e "TERM=xterm-256color" \
        -e "NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache" \
        -e "OPENCLAW_NO_RESPAWN=1" \
        -e "AGENTBOT_USER_ID=$user_id" \
        -e "AGENTBOT_PLAN=$plan" \
        -e "AGENTBOT_AI_PROVIDER=${AGENTBOT_AI_PROVIDER:-anthropic}" \
        -e "AGENTBOT_API_KEY=${AGENTBOT_API_KEY:-}" \
        -e "OPENCLAW_GATEWAY_PORT=18789" \
        --restart unless-stopped \
        "$IMAGE_NAME"
    
    # Start the container
    docker start "$container_name"
    
    log "Created and started $container_name on port $port"
    echo "{\"container\":\"$container_name\",\"port\":$port,\"status\":\"running\"}"
}

# Start a stopped container
start_container() {
    local user_id="$1"
    local container_name="agentbot-$user_id"
    
    if ! docker inspect "$container_name" >/dev/null 2>&1; then
        error "Container $container_name not found"
        return 1
    fi
    
    local status=$(docker inspect -f '{{.State.Status}}' "$container_name")
    
    case "$status" in
        running)
            warn "Container already running"
            ;;
        paused)
            log "Resuming paused container $container_name..."
            docker unpause "$container_name"
            ;;
        exited|created)
            log "Starting container $container_name..."
            docker start "$container_name"
            ;;
        *)
            error "Container in unexpected state: $status"
            return 1
            ;;
    esac
    
    echo "{\"container\":\"$container_name\",\"status\":\"running\"}"
}

# Pause a container (saves memory)
pause_container() {
    local user_id="$1"
    local container_name="agentbot-$user_id"
    
    if ! docker inspect "$container_name" >/dev/null 2>&1; then
        error "Container $container_name not found"
        return 1
    fi
    
    local status=$(docker inspect -f '{{.State.Status}}' "$container_name")
    
    if [ "$status" = "running" ]; then
        log "Pausing $container_name..."
        docker pause "$container_name"
        log "Paused $container_name (memory freed)"
    fi
    
    echo "{\"container\":\"$container_name\",\"status\":\"paused\"}"
}

# Stop and remove a container
destroy_container() {
    local user_id="$1"
    local container_name="agentbot-$user_id"
    local backup="${2:-false}"
    
    if ! docker inspect "$container_name" >/dev/null 2>&1; then
        warn "Container $container_name not found"
        return 0
    fi
    
    # Backup user data if requested
    if [ "$backup" = "true" ]; then
        local user_data_dir="$DATA_DIR/$user_id"
        local backup_dir="$DATA_DIR/backups/$user_id-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"
        cp -r "$user_data_dir"/* "$backup_dir/" 2>/dev/null || true
        log "Backed up user data to $backup_dir"
    fi
    
    log "Stopping and removing $container_name..."
    docker stop "$container_name" 2>/dev/null || true
    docker rm "$container_name" 2>/dev/null || true
    
    log "Destroyed $container_name"
    echo "{\"container\":\"$container_name\",\"status\":\"destroyed\"}"
}

# Pause least recently used container (for eviction)
pause_lru_container() {
    local oldest=""
    local oldest_time=""
    
    docker ps --filter "name=agentbot-" --format '{{.Names}}|{{.RunningFor}}' | while IFS='|' read -r name running_for; do
        if [ -z "$oldest_time" ]; then
            oldest="$name"
            oldest_time="$running_for"
        fi
    done
    
    if [ -n "$oldest" ]; then
        log "Pausing LRU container: $oldest (running for: $oldest_time)"
        docker pause "$oldest"
    fi
}

# Get container status
get_status() {
    local user_id="$1"
    local container_name="agentbot-$user_id"
    
    if ! docker inspect "$container_name" >/dev/null 2>&1; then
        echo "{\"container\":\"$container_name\",\"status\":\"not_found\"}"
        return 0
    fi
    
    local status=$(docker inspect -f '{{.State.Status}}' "$container_name")
    local started_at=$(docker inspect -f '{{.State.StartedAt}}' "$container_name" 2>/dev/null || echo "null")
    local port=$(docker port "$container_name" 18789 2>/dev/null | grep -oE '[0-9]+$' || echo "null")
    
    echo "{\"container\":\"$container_name\",\"status\":\"$status\",\"startedAt\":\"$started_at\",\"port\":$port}"
}

# Pull the official agent image
build_image() {
    log "Pulling official OpenClaw image: $IMAGE_NAME..."
    docker pull "$IMAGE_NAME"
    log "Image ready: $IMAGE_NAME"
}

# Main command dispatcher
case "${1:-help}" in
    create)    create_container "${2:?user_id required}" "${3:-solo}" ;;
    start)     start_container "${2:?user_id required}" ;;
    pause)     pause_container "${2:?user_id required}" ;;
    destroy)   destroy_container "${2:?user_id required}" "${3:-false}" ;;
    status)    get_status "${2:?user_id required}" ;;
    list)      list_containers ;;
    build)     build_image ;;
    help)
        echo "Usage: $0 <command> [args]"
        echo ""
        echo "Commands:"
        echo "  create <user_id> [plan]   Create and start a new agent container"
        echo "  start <user_id>           Start/resume a paused/stopped container"
        echo "  pause <user_id>           Pause a running container"
        echo "  destroy <user_id> [backup] Destroy container (backup=true saves data)"
        echo "  status <user_id>          Get container status"
        echo "  list                      List all agent containers"
        echo "  build                     Build the agent Docker image"
        ;;
    *) error "Unknown command: $1"; exit 1 ;;
esac
