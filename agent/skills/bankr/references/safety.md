# Safety & Access Control

## Two-Layer Security

1. **Wallet-level** (bankr.bot → Security) — applies across all surfaces
2. **Per-API-key** (bankr.bot/api-keys) — specific to individual keys

Both must pass for transactions to execute.

## Wallet-Level Controls

- Pause all transactions instantly
- Daily spending limit ($500 default, adjustable $1–$1,000,000)
- Per-transaction limits
- Permitted recipient allowlist
- Disable arbitrary contract calls
- Fail-closed: if USD valuation unavailable and limits enabled, transaction is rejected

## API Key Capability Flags

| Flag | Controls |
|------|---------|
| `walletApiEnabled` | Wallet endpoints |
| `agentApiEnabled` | Agent AI features |
| `tokenLaunchApiEnabled` | Token deployment |
| `llmGatewayEnabled` | LLM Gateway |
| Read-only | Blocks all write operations |

## Rate Limits

- Standard: 100 agent messages/day, 120 API req/min
- Bankr Club: 1,000 agent messages/day

## Best Practices

- Use a dedicated agent wallet separate from personal accounts
- Store keys in env vars (`BANKR_API_KEY`, `BANKR_LLM_KEY`), never in code
- Use separate keys per agent/environment for independent revocation
- Test with small amounts before production
- If compromised: pause wallet → revoke key → rotate → audit
