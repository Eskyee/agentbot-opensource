# Team OpenClaw Setup

## Available Skills (43/76 ready)

### Essential Skills for Team
- ✅ apple-notes - Apple Notes management
- ✅ apple-reminders - Reminders management  
- ✅ bear-notes - Bear notes
- ✅ clawhub - Skill marketplace
- ✅ exec - Run shell commands
- ✅ files - File operations
- ✅ memory - Memory/search
- ✅ slack - Slack integration
- ✅ telegram - Telegram bot
- ✅ web-fetch - Web content fetching
- ✅ web-search - Web search

### Web3/DeFi Skills
- ✅ authenticate-wallet - Wallet auth
- ✅ building-with-base-account - Base account SDK
- ✅ connecting-to-base-network - Base network config
- ✅ deploy-contracts-on-base - Deploy Solidity
- ✅ fund - Add money to wallet
- ✅ pay-for-service - Paid API calls
- ✅ query-onchain-data - Query Base data
- ✅ running-a-base-node - Run Base node
- ✅ search-for-service - Find x402 services
- ✅ send-usdc - Send USDC
- ✅ trade - Swap tokens
- ✅ x402 - Payment protocol

### Missing (install if needed)
- 1password - Secrets management
- blogwatcher - RSS monitoring
- bluebubbles - iMessage
- discord - Discord bot

## Team Commands

```bash
# List skills
openclaw skills list

# Check skill status
openclaw skills check

# Install new skill
clawhub install <skill-name>
```

## MCP Configuration

Add team MCPs to `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "install": {
      "nodeManager": "npm"
    }
  }
}
```
