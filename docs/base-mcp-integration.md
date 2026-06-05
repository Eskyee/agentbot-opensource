# Base MCP Integration — Agentbot

Connect AI agents to Base Account smart wallets via Model Context Protocol.

## What Is Base MCP?

Base MCP lets AI agents (Claude, ChatGPT, Atlas) directly interact with Base blockchain:
- Check wallet balances
- Swap tokens
- Sign messages
- Execute DeFi transactions
- All via natural language

**Security:** Non-custodial. MCP server never holds keys. Every tx requires user sign-off.

## Architecture

```
AI Agent (Atlas) → MCP Server → Base Account Smart Wallet → Base Chain
     │                  │                    │
  "Check balance"   Translates           Signs & executes
                    natural language      on-chain
                    → tool calls
```

## Setup

### 1. Install Base MCP Server

```bash
# Clone the Base MCP server
git clone https://github.com/coinbase/base-mcp.git
cd base-mcp
npm install
npm run build
```

### 2. Configure for Claude Desktop / OpenClaw

Add to your MCP client config:

```json
{
  "mcpServers": {
    "base": {
      "command": "node",
      "args": ["/opt/base-mcp/dist/index.js"],
      "env": {
        "BASE_NETWORK_ID": "8453",
        "CDP_API_KEY_NAME": "e729d6f2-8b2c-4f78-8c20-49c281e377ed",
        "CDP_API_KEY_PRIVATE_KEY": "YOUR_PRIVATE_KEY"
      }
    }
  }
}
```

### 3. Connect Base Account

1. Open your AI client (Claude Desktop / OpenClaw)
2. Say: *"Connect my Base account"*
3. MCP server opens wallet connection flow
4. User signs in via Coinbase Wallet / Base Account
5. Agent can now propose transactions

## Available MCP Tools

| Tool | Description | Example Prompt |
|------|-------------|----------------|
| `get_balance` | Check ETH/ERC-20 balances | "What's my USDC balance?" |
| `swap_tokens` | Swap via Uniswap/Base DEX | "Swap 10 USDC for ETH" |
| `send_token` | Transfer ERC-20 tokens | "Send 5 USDC to 0x..." |
| `sign_message` | Sign a message | "Sign this for verification" |
| `read_contract` | Read smart contract state | "How many wristbands minted?" |
| `write_contract` | Write to smart contract | "Mint wristband #42" |
| `get_transaction` | Check tx status | "What happened with tx 0x...?" |

## Agentbot Integration

### Atlas Base Tools

```typescript
// web/app/lib/mcp-base.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

let mcpClient: Client | null = null

export async function getMCPClient(): Promise<Client> {
  if (mcpClient) return mcpClient

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['/opt/base-mcp/dist/index.js'],
    env: {
      BASE_NETWORK_ID: '8453',
      CDP_API_KEY_NAME: process.env.CDP_API_KEY_NAME!,
      CDP_API_KEY_PRIVATE_KEY: process.env.CDP_API_KEY_PRIVATE_KEY!,
    },
  })

  mcpClient = new Client({ name: 'agentbot', version: '1.0.0' })
  await mcpClient.connect(transport)
  return mcpClient
}

export async function checkBalance(address: string) {
  const client = await getMCPClient()
  return client.callTool({
    name: 'get_balance',
    arguments: { address, network: 'base' },
  })
}

export async function swapTokens(from: string, to: string, amount: string) {
  const client = await getMCPClient()
  return client.callTool({
    name: 'swap_tokens',
    arguments: { fromToken: from, toToken: to, amount },
  })
}
```

### OpenClaw Skill Integration

The `nft-deploy` skill provides step-by-step NFT deployment guidance.
The `base-mcp` skill (this guide) provides AI-to-chain connectivity.

## Security Model

```
Layer 1: User Sign-Off     → Every tx requires manual approval
Layer 2: Non-Custodial     → MCP server never sees private keys
Layer 3: Transaction Limits → Set max value per tx in wallet
Layer 4: Allowlisting      → Only approved contracts can be called
Layer 5: Audit Trail       → All actions logged in wallet history
```

## Useful Links

| Resource | URL |
|----------|-----|
| Base MCP GitHub | https://github.com/coinbase/base-mcp |
| Base Account SDK | https://docs.base.org/base-account |
| CDP Portal | https://cdp.coinbase.com |
| Base Docs | https://docs.base.org |
