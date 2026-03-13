#!/bin/bash

# Verification script for AgentBot Render MCP deployment
# Run this after deployment completes (5-10 minutes after push)

API_URL="https://agentbot-api.onrender.com"
COLORS='\033[0;36m' # Cyan
GREEN='\033[0;32m'  # Green
RED='\033[0;31m'    # Red
NC='\033[0m'        # No Color

echo -e "${COLORS}════════════════════════════════════════${NC}"
echo -e "${COLORS}AgentBot Render MCP - Deployment Verification${NC}"
echo -e "${COLORS}════════════════════════════════════════${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    body=$(curl -s "$url")
    
    if [ "$response" = "200" ]; then
        if [[ "$body" == *"$expected"* ]]; then
            echo -e "${GREEN}✅ PASS${NC}"
            echo "  Response: $(echo $body | jq -r '.' 2>/dev/null || echo $body | head -c 80)"
            return 0
        else
            echo -e "${RED}❌ FAIL (wrong response)${NC}"
            echo "  Expected to contain: $expected"
            echo "  Got: $(echo $body | head -c 100)"
            return 1
        fi
    else
        echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
        echo "  Response: $(echo $body | head -c 100)"
        return 1
    fi
}

# Test endpoints
echo "Health Endpoints:"
test_endpoint "Basic Health" "$API_URL/health" "ok"
test_endpoint "MCP Gateway Health" "$API_URL/api/render-mcp/health" "operational"
test_endpoint "AI Provider Health" "$API_URL/api/ai/health" "healthy"

echo ""
echo "Info Endpoints:"
test_endpoint "MCP Info" "$API_URL/api/render-mcp/info" "Render MCP"
test_endpoint "MCP Setup" "$API_URL/api/render-mcp/setup" "setup"
test_endpoint "MCP Tools" "$API_URL/api/render-mcp/tools" "tools"

echo ""
echo "AI Provider Endpoints:"
test_endpoint "AI Models" "$API_URL/api/ai/models" "models"

echo ""
echo -e "${COLORS}════════════════════════════════════════${NC}"
echo "Verification complete!"
echo -e "${COLORS}════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "1. Use RENDER_MCP_QUICKSTART.md to configure your IDE"
echo "2. Set RENDER_API_KEY in Render dashboard (optional)"
echo "3. Set OPENROUTER_API_KEY for cloud models (optional)"
echo "4. Reload your IDE and test: 'List my Render services'"
echo ""
