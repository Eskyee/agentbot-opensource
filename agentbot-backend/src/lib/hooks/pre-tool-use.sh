#!/bin/bash
# Pre-Tool-Use Hook — Agentbot Permission System
#
# Receives JSON on stdin with tool call details:
#   {"tool":"bash","input":{"command":"ls -la"}}
#
# Returns JSON decision on stdout:
#   {"allow":true} or {"allow":false,"reason":"..."}
#
# Called by docker agent --hook-pre-tool-use ./pre-tool-use.sh
# Environment:
#   AGENTBOT_API_URL  — Backend URL (e.g., https://YOUR_SERVICE_URL)
#   AGENTBOT_USER_ID  — Owner user ID
#   AGENTBOT_AGENT_ID — This agent's ID
#   INTERNAL_API_KEY  — Auth token for backend

set -euo pipefail

# Read tool call from stdin
TOOL_INPUT=$(cat)

# Extract tool name and input
TOOL_NAME=$(echo "$TOOL_INPUT" | jq -r '.tool // .toolName // "unknown"' 2>/dev/null)
TOOL_INPUT_JSON=$(echo "$TOOL_INPUT" | jq -c '.input // .toolInput // {}' 2>/dev/null)

# Environment
API_URL="${AGENTBOT_API_URL:-http://localhost:3001}"
USER_ID="${AGENTBOT_USER_ID:-unknown}"
AGENT_ID="${AGENTBOT_AGENT_ID:-unknown}"
AUTH_KEY="${INTERNAL_API_KEY:-}"

# Call backend to classify
RESPONSE=$(curl -s --max-time 10 \
  "${API_URL}/api/hooks/classify" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_KEY}" \
  -d "{
    \"toolName\": \"${TOOL_NAME}\",
    \"toolInput\": ${TOOL_INPUT_JSON},
    \"agentId\": \"${AGENT_ID}\",
    \"userId\": \"${USER_ID}\"
  }" 2>/dev/null) || {
    # If backend is unreachable, default to deny (fail-closed)
    echo '{"allow":false,"reason":"Permission service unreachable — failing closed"}'
    exit 0
  }

# Parse response
ALLOW=$(echo "$RESPONSE" | jq -r '.allow // false' 2>/dev/null)
REASON=$(echo "$RESPONSE" | jq -r '.reason // "Unknown"' 2>/dev/null)
REQUEST_ID=$(echo "$RESPONSE" | jq -r '.requestId // ""' 2>/dev/null)

if [ "$ALLOW" = "true" ]; then
  echo '{"allow":true}'
else
  # Include request ID so the tool can display it
  echo "{\"allow\":false,\"reason\":\"${REASON}\",\"requestId\":\"${REQUEST_ID}\"}"
fi
