# Automation

Automated trading strategies via natural language.

## Order Types

| Type | Description |
|------|-------------|
| Limit Order | Execute at a specific price point |
| Stop Loss | Automatically sell to limit losses |
| DCA | Regular fixed investments at intervals |
| TWAP | Spread large orders over time to reduce slippage |
| Scheduled | Run any command on a schedule |

## Chain Support

All types supported on EVM chains (Base, Polygon, Ethereum). Solana supports limit, stop loss, DCA, and scheduled commands.

## Prompt Examples

```
"Set a limit order to buy ETH at $2,000"
"Set a stop loss on my ETH at $1,800"
"DCA $50 into ETH every week"
"Buy $10 of ETH every day for 30 days"
"Alert me if ETH drops below $2,000"
```

## Best Practices

- Start with small test amounts
- Combine DCA + stop loss for risk management
- Review automations weekly
- Account for gas fees in calculations
- Automation executes strategy — it doesn't replace monitoring
