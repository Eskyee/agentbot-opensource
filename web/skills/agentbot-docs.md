# Agentbot Documentation

## Overview
Access Agentbot platform documentation at https://agentbot.sh/docs

## MCP Server
- **URL:** https://agentbot.sh/docs/mcp
- **Documentation:** https://agentbot.sh/docs

## Usage

```bash
# Add as skill to agent
npx skills add https://agentbot.sh/docs

# Search docs via MCP
curl -X POST https://agentbot.sh/api/docs/search \
  -H "Content-Type: application/json" \
  -d '{"query": "your question"}'
```

## Endpoints
- `/api/docs/search` - Search documentation
- `/api/wallet` - Wallet status
- `/api/wallet/cdp` - Create EVM wallet
- `/api/workflow/signup` - User signup workflow
- `/api/wristband/verify` - Check NFT ownership
