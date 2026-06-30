# Transfers

Send tokens across multiple chains to addresses, ENS names, or social handles.

## Wallet API Endpoint

`POST /wallet/transfer` — synchronous transfer to address or ENS.

## Recipient Types

- **0x address** — direct EVM address
- **ENS / Basename / Coinbase ID** — resolved client-side before submission
- **Social handles** (Twitter, Farcaster, Telegram) — Agent API only (wallet must be linked on the platform)

## Amount Formats

- `$50` — dollar amount
- `50%` — percentage of balance
- `0.1 ETH` — exact amount

## Agent Prompt Examples

```
"Send 10 USDC to vitalik.eth"
"Transfer $50 of ETH to 0x1234..."
"Send 0.01 ETH to @username on Farcaster"
"Airdrop 1 USDC each to [list of addresses]"
```

## Supported Chains

EVM: Base, Polygon, Ethereum, Arbitrum, and others.
Solana: Agent API only.

## Security

- Verify recipient addresses before confirming
- Test with small amounts for new addresses
- Maintain adequate native tokens for gas
- Social handle transfers require wallet linking on respective platform
