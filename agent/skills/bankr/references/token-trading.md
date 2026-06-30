# Token Trading

Execute token trades and swaps across multiple blockchains.

## Supported Chains

| Chain | Native | Notes |
|-------|--------|-------|
| Base | ETH | Low fees, recommended |
| Polygon | MATIC | Fast, cheap |
| Ethereum | ETH | Highest liquidity, high gas |
| Unichain | ETH | Newer L2 |
| Solana | SOL | High speed, minimal fees |

## Amount Formats

- USD: `$50`
- Percentage of balance: `50%`
- Exact amount: `0.1 ETH`

## Prompt Examples

```
"Swap 0.1 ETH for USDC on Base"
"Buy $50 of BNKR on Base"
"Sell 50% of my ETH holdings"
"Bridge 0.5 ETH from Ethereum to Base"
"Move 100 USDC from Polygon to Solana"
```

## Tips

- Specify the chain for lesser-known tokens
- Base is preferred for most ops due to low fees
- Cross-chain routes are automatically optimized
- Default slippage is applied automatically; specify with "with 1% slippage"
