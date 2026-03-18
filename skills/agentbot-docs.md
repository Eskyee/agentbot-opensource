# Agentbot Documentation

## Overview
Access Agentbot platform documentation at https://agentbot.raveculture.xyz/docs

## MCP Server
- **URL:** https://agentbot.raveculture.xyz/docs/mcp
- **Documentation:** https://agentbot.raveculture.xyz/docs

## Usage

```bash
# Add as skill to agent
npx skills add https://agentbot.raveculture.xyz/docs

# Search docs via MCP
curl -X POST https://agentbot.raveculture.xyz/api/docs/search \
  -H "Content-Type: application/json" \
  -d '{"query": "your question"}'
```

## Endpoints
- `/api/docs/search` - Search documentation
- `/api/wallet` - Wallet status
- `/api/wallet/cdp` - Create EVM wallet
- `/api/workflow/signup` - User signup workflow
- `/api/wristband/verify` - Check NFT ownership
