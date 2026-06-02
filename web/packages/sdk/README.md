# @agentbot/sdk

TypeScript SDK for the Agentbot platform. Provision agents, manage skills, send messages, and handle x402 micropayments — all with full type safety.

## Installation

```bash
npm install @agentbot/sdk
```

## Quick Start

```typescript
import { AgentbotClient } from '@agentbot/sdk';

const client = new AgentbotClient({
  apiKey: process.env.AGENTBOT_API_KEY,
  baseUrl: 'https://agentbot.sh',
});

// Send a chat message
const response = await client.chat({
  message: 'Find me a venue in London for 200 people',
});

console.log(response.reply);
```

## API Reference

### Chat

```typescript
// Synchronous chat
const response = await client.chat({
  message: 'What BPM works for peak-time techno?',
  model: 'mimo-v2.5',  // optional model override
});

console.log(response.reply);
console.log(response.agent);
console.log(response.toolCalls);

// Streaming chat
const stream = await client.chatStream({
  message: 'Recommend 5 warehouse rave tracks',
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

### Models

```typescript
const models = await client.models();

for (const model of models) {
  console.log(`${model.name} — ctx: ${model.contextLength}`);
  console.log(`  Prompt: $${model.pricing.prompt}/token`);
  console.log(`  Completion: $${model.pricing.completion}/token`);
}
```

### Agents

```typescript
// Create a new agent
const agent = await client.agents.create({
  name: 'basefm-dj',
  model: 'mimo-v2.5',
  channels: ['telegram', 'discord'],
  skills: ['venue-finder', 'royalty-tracker'],
  personality: 'selector',  // basement | selector | A&R | road | label
});

// List all agents
const agents = await client.agents.list();

// Get agent details
const details = await client.agents.get(agentId);

// Update agent config
await client.agents.update(agentId, {
  skills: ['venue-finder', 'instant-split', 'setlist-oracle'],
});

// Delete an agent
await client.agents.delete(agentId);

// Send a message to an agent
const response = await client.agents.message(agentId, {
  content: 'Plan my set for Warehouse Project',
});

// Stream from an agent
const stream = await client.agents.stream(agentId, {
  content: 'Analyze my royalty statements',
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

### Skills

```typescript
// List installed skills
const skills = await client.skills.list(agentId);

// Install a skill
await client.skills.install(agentId, 'venue-finder');

// Uninstall a skill
await client.skills.uninstall(agentId, 'venue-finder');

// Get skill details
const skill = await client.skills.get('venue-finder');
console.log(skill.tools);
console.log(skill.mcpServer);
```

### Wallet

```typescript
// Check balance
const balance = await client.wallet.balance(agentId);
console.log(`$${balance.usdc} USDC on ${balance.network}`);

// Transfer USDC
await client.wallet.transfer(agentId, {
  to: '0xRecipient...',
  amount: 5.0,
  token: 'USDC',
});

// View payment history
const payments = await client.wallet.payments(agentId, {
  since: new Date('2026-06-01'),
  limit: 50,
});

// Set spending limits
await client.wallet.setSpendLimit(agentId, {
  daily: 1.00,
  perCall: 0.05,
  token: 'USDC',
});
```

### Health

```typescript
const health = await client.health();
console.log(health.status);   // 'healthy' | 'degraded' | 'down'
console.log(health.version);
console.log(health.uptime);
```

## MCP Client

Connect to Agentbot MCP servers to call tools programmatically.

```typescript
import { McpClient } from '@agentbot/sdk';

const mcp = new McpClient({
  apiKey: process.env.AGENTBOT_API_KEY,
});

// List available MCP servers
const servers = await mcp.listServers();

// Activate a service
await mcp.activate({ name: 'gecko-data' });

// List tools on a service
const tools = await mcp.listTools('gecko-data');

// Call a tool
const result = await mcp.callTool({
  service: 'gecko-data',
  tool: 'get_pool_data',
  args: { pool: '0xabc...', network: 'base' },
});

console.log(result.content);

// Deactivate
await mcp.deactivate({ name: 'gecko-data' });
```

## MCP Server Builder

Build MCP servers that expose tools over SSE or stdio.

```typescript
import { McpServer } from '@agentbot/sdk';

const server = new McpServer({
  name: 'venue-finder',
  version: '1.0.0',
});

// Register tools
server.tool('find_venues', {
  description: 'Search venues by location and capacity',
  inputSchema: {
    type: 'object',
    properties: {
      city: { type: 'string' },
      capacity: { type: 'number' },
    },
    required: ['city'],
  },
}, async ({ city, capacity }) => {
  const venues = await searchVenues(city as string, capacity as number);
  return {
    content: [{ type: 'text', text: JSON.stringify(venues) }],
  };
});

// Start over SSE
server.start({ transport: 'sse', port: 8402 });
```

## x402 Payments

Handle HTTP 402 payment flows for paid APIs and MCP services.

```typescript
import { x402 } from '@agentbot/sdk';

// Configure x402
x402.configureX402({
  apiKey: process.env.AGENTBOT_API_KEY,
});

// Pay for a request that returns 402
const result = await x402.payForRequest({
  url: 'https://premium-api.example.com/data',
  method: 'GET',
  maxAmount: 0.05,
});

console.log(result.data);
console.log(`Paid $${result.payment.amount} USDC`);

// Auto-pay with MCP tools
const toolResult = await client.mcp.invoke({
  service: 'gecko-data',
  tool: 'get_pool_data',
  args: { pool: '0xabc...', network: 'base' },
  payment: x402.auto(0.05),  // auto-pay up to $0.05
});
```

### Publishing a Paid MCP Service

```typescript
import { McpServer, x402 } from '@agentbot/sdk';

const server = new McpServer({
  name: 'gecko-data',
  version: '1.0.0',
  pricing: x402.pricing({
    get_pool:  { price: 0.001, token: 'USDC', network: 'base' },
    get_token: { price: 0.001, token: 'USDC', network: 'base' },
    search:    { price: 0.002, token: 'USDC', network: 'base' },
  }),
});

server.tool('get_pool', {
  description: 'Get pool data from GeckoTerminal',
  inputSchema: {
    type: 'object',
    properties: {
      pool: { type: 'string', description: 'Pool address' },
      network: { type: 'string', description: 'Network (base, solana, eth)' },
    },
    required: ['pool', 'network'],
  },
}, async ({ pool, network }) => {
  const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/${network}/pools/${pool}`);
  return { content: [{ type: 'text', text: await res.text() }] };
});

server.start({ transport: 'sse', port: 8402 });
```

## Error Handling

```typescript
import {
  AgentbotClient,
  AgentbotError,
  PaymentRequiredError,
  RateLimitError,
} from '@agentbot/sdk';

try {
  const result = await client.mcp.invoke({
    service: 'premium-data',
    tool: 'get_analysis',
    args: { symbol: 'ETH' },
    payment: x402.auto(),
  });
} catch (err) {
  if (err instanceof PaymentRequiredError) {
    console.log(`Insufficient balance. Need $${err.required} USDC.`);
    console.log(`Current balance: $${err.balance} USDC`);
  } else if (err instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${err.retryAfter}s.`);
  } else if (err instanceof AgentbotError) {
    console.log(`API error: ${err.code} — ${err.message}`);
  }
}
```

## Configuration

```typescript
const client = new AgentbotClient({
  // Required
  apiKey: process.env.AGENTBOT_API_KEY,

  // Optional
  baseUrl: 'https://agentbot.sh',     // default
  timeout: 30_000,                     // request timeout in ms
  retries: 3,                          // auto-retry on 429/5xx
});
```

## License

MIT — see [LICENSE](../../LICENSE)
