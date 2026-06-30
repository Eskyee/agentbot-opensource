# Portfolio

Query token balances and portfolio across multiple chains.

## Wallet API Endpoint

`GET /wallet/portfolio` — synchronous, returns multi-chain balances, USD values, PnL.

Supported chains: Base, Polygon, Ethereum, Unichain, Solana, World Chain, Arbitrum, BNB Chain.

- Any valid API key with a wallet can access this (no feature flags required)
- Hides tokens under $1 by default
- Optional PnL tracking and NFT holdings

## Agent Prompt Examples

```
"What's my portfolio?"
"Show my ETH balance on Base"
"What are my total holdings?"
"Show my NFTs"
"What's my PnL this week?"
```

## Use Cases

- Verify transaction completions
- Check gas fee availability before trades
- Evaluate trading capacity
- Portfolio composition analysis
