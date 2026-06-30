# Token Deployment

Launch ERC-20 tokens on Base or SPL tokens on Solana.

## Base (ERC-20 via Uniswap V4)

- Fixed 100B supply, non-mintable
- 0.7% swap fee (95% creator / 5% protocol)
- Glidepath tool for gradual profit-taking (web-only)

## Solana (SPL via Raydium LaunchLab)

- Bonding curve that auto-migrates to liquidity pool
- 0.5% creator fees (99.9% / 0.1% split if fee wallet set)
- Vesting available with configurable cliff and unlock
- Fee Key NFTs represent LP trading fee rights post-migration
- Locked liquidity prevents rug pulls

## Rate Limits

| Tier | Daily Sponsored Launches |
|------|--------------------------|
| Standard | 1 (Base: 50/day, Solana: unlimited) |
| Bankr Club | 10 (Base: 100/day) |

## Prompt Examples

```
"Launch a token called MYTOKEN on Base"
"Deploy a SPL token called CULTURE on Solana"
"Launch a token with vesting: 6-month cliff, 24-month unlock"
```

## Legal Note

Consult jurisdiction-specific securities regulations before deploying tokens.
