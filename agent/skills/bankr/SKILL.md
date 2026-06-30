# Bankr: AI-Powered Crypto Trading Agent

Bankr is a natural language-enabled platform for cryptocurrency trading, portfolio management, and DeFi operations. Agentbot users can connect their Bankr API key in Settings to give their agent full trading capabilities.

## Getting Started

Users add their Bankr API key at **Settings → Bankr Key** in Agentbot. Keys are obtained from https://bankr.bot/api-keys.

API key setup via CLI (if needed):
```bash
npm install -g @bankr/cli
bankr login email user@example.com
# enter OTP when prompted
bankr whoami
```

## Core Capabilities

- **Trading**: Swaps, limit orders, DCA strategies, leverage trading (Hyperliquid/Avantis)
- **Portfolio Management**: Real-time balances, PnL tracking, NFT holdings across 8 blockchains
- **Market Research**: Token prices, technical analysis, trending assets
- **Transfers**: Multi-chain token sends to addresses, ENS names, or social handles
- **Token Deployment**: Launch ERC-20 tokens on Base or SPL tokens on Solana
- **Automation**: Stop losses, TWAP execution, scheduled trading
- **Advanced**: Polymarket betting, x402 API calls, web browsing, arbitrary transactions
- **LLM Gateway**: Multi-model AI access (Claude, GPT, Gemini, etc.) at `llm.bankr.bot`

## Supported Blockchains

Base, Ethereum, Polygon, Solana, Unichain, World Chain, Arbitrum, BNB Chain.

## API Endpoints

All requests use `X-API-Key: <key>` header against `https://api.bankr.bot`.

### Agent API (async, AI-powered)
- `POST /agent/prompt` — submit natural language prompt, returns `{ jobId, threadId }`
- `GET /agent/job/{jobId}` — poll for result; status: `pending | processing | completed | failed | cancelled`
  - Response includes `statusUpdates[]` (progress messages), `richData[]` (structured results), `resetAt` on 429
- `POST /agent/job/{jobId}/cancel` — cancel a pending or processing job (idempotent)

### Wallet API (synchronous)
- `GET /wallet/me` — wallet addresses, social accounts, Bankr Club status, leaderboard, ref code
- `GET /wallet/portfolio` — multi-chain balances, PnL (`?include=pnl`), NFTs (`?include=nfts`)
- `POST /wallet/transfer` — ERC20/native transfer on Base (`tokenAddress`, `recipientAddress`, `amount`, `isNativeToken`)
- `POST /wallet/sign` — sign messages/typed data/transactions (`personal_sign`, `eth_signTypedData_v4`, `eth_signTransaction`)
- `POST /wallet/submit` — submit raw EVM transaction (`transaction.to`, `transaction.chainId`, optional `waitForConfirmation`)

### Agent Profile API
- `GET /agent/profile` — get own profile (any approval state)
- `POST /agent/profile` — create profile (`projectName`, `tokenAddress` required; `slug`, `description`, `website`, `teamMembers[]`, `products[]`, `revenueSources[]`)
- `PUT /agent/profile` — update fields (arrays are replaced, not merged)
- `DELETE /agent/profile` — delete profile
- `POST /agent/profile/update` — post project update (`title`, `content`; capped at 50 entries)
- `GET /agent-profiles` — list approved profiles (`?sort=marketCap|newest&limit=20&offset=0`)
- `GET /agent-profiles/:identifier` — full profile by token address or slug

### Utility (no auth required)
- `GET /addresses/resolve?value=vitalik.eth&type=ens` — resolve ENS, Basename, Twitter, Farcaster to address
  - `type`: `address | ens | twitter | farcaster`

## Agentbot Integration

The agent calls Bankr via the user's stored API key. When a user asks about balances, trades, or portfolio:

1. Use `/api/bankr/prompt` to submit natural language to the Agent API
2. Poll `/api/bankr/prompt?jobId=<id>` every 2s until `status === 'completed'`
3. Return `response` field to the user

For portfolio/balance data without AI overhead, use `/api/bankr/balances` (calls Wallet API).

## Prompt Examples

```
"What's my ETH balance on Base?"
"Buy $50 of ETH on Base"
"Swap 0.1 ETH for USDC"
"Show my full portfolio"
"Set a stop loss on my ETH at $2,000"
"What tokens are trending on Base today?"
"Send 10 USDC to vitalik.eth"
"Launch a token called MYTOKEN on Base"
```

## Security

- Wallet-level spending limits ($500/day default, configurable)
- Per-API-key capability flags: wallet, agent, token launch, LLM gateway, read-only
- IP whitelisting available
- Rate limits: 100 agent messages/day (standard), 1,000/day (Bankr Club). 429 response includes `resetAt` timestamp (rolling 24h window).
- See references/safety.md for full security model

## Plans & Access

| Feature | Standard | Bankr Club / Max Mode |
|---------|----------|----------------------|
| Agent AI prompts | ✗ | ✓ |
| Portfolio (Wallet API) | ✓ | ✓ |
| Transfers | ✓ | ✓ |
| Daily agent messages | — | 1,000 |

If users see "Bankr Club membership or Max Mode is required", they need to upgrade at https://bankr.bot.

## References

- [API Workflow](references/api-workflow.md) — async job pattern, polling, status updates
- [Token Trading](references/token-trading.md) — swaps, chains, amounts
- [Portfolio](references/portfolio.md) — balances, PnL, NFT holdings
- [Transfers](references/transfers.md) — sends, ENS, social handles
- [Automation](references/automation.md) — limit orders, DCA, stop loss, TWAP
- [Market Research](references/market-research.md) — prices, analysis, trending
- [Token Deployment](references/token-deployment.md) — launch ERC-20 / SPL tokens
- [LLM Gateway](references/llm-gateway.md) — multi-model AI via bankr
- [Error Handling](references/error-handling.md) — error codes, fixes
- [Safety](references/safety.md) — spending limits, access control

## Resources

- [bankr.bot](https://bankr.bot)
- [API Keys](https://bankr.bot/api-keys)
- [Documentation](https://docs.bankr.bot)
