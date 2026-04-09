# Bankr - Crypto Trading Agent

Agentbot integrates with Bankr for crypto trading via natural language.

## Setup

Users need their own Bankr API key from https://bankr.bot/api

## Capabilities

- **Token Swaps**: Buy/sell/swap tokens across Base, Polygon, Ethereum, Solana
- **Balances**: Check wallet balances across chains
- **Transfers**: Send crypto to addresses or ENS names
- **Market Research**: Get prices, technical analysis, trending tokens

## Commands

```bash
# Check balance
bankr balances --chain base

# Buy tokens
bankr prompt "Buy $50 of ETH on Base"

# Check portfolio
bankr prompt "Show my portfolio"
```

## Documentation

Full docs: https://docs.bankr.bot
