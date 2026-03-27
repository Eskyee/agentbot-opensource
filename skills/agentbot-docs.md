# Agentbot Documentation

## Overview
Access Agentbot platform documentation at https://agentbot.raveculture.xyz/docs

## Project Information
- **Production Site:** https://agentbot.raveculture.xyz
- **Open Source Demo:** https://web-iota-hazel-25.vercel.app
- **Talent App:** https://talent.app/~/projects/26f977bb-d436-4e28-830e-184757f20f95
- **Production Repo:** https://github.com/Eskyee/agentbot (private)
- **Open Source Repo:** https://github.com/Eskyee/agentbot-opensource (public)

## Strategy
**Build in the open, ship in private.** The open source repo shows architecture, CI quality, and code standards. The private repo has real features, customer data, and production infra. The open source demo builds trust and attracts contributors without handing over the sauce.

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
