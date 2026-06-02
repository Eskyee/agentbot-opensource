# @agentbot/sdk

TypeScript SDK for the Agentbot platform. Provision agents, manage skills, send messages, and handle x402 micropayments — all with full type safety.

## Installation

```bash
npm install @agentbot/sdk
```

## Quick Start

```typescript
import { Agentbot } from '@agentbot/sdk';

const client = new Agentbot({
  apiKey: process.env.AGENTBOT_API_KEY,
  baseUrl: 'https://agentbot.sh',
});

// Provision a new agent
const agent = await client.agents.create({
  name: 'my-dj-agent',
  model: 'mimo-v2.5',
  channels: ['telegram', 'discord'],
  skills: ['venue-finder', 'instant-split'],
});

console.log(`Agent ${agent.name} provisioned at ${agent.subdomain}`);
```

## API Reference

### Agents

```typescript
// Create an agent
const agent = await client.agents.create({
  name: 'basefm-dj',
  model: 'mimo-v2.5',
  channels: ['telegram'],
  skills: ['venue-finder', 'royalty-tracker'],
  personality: 'selector',  // basement | selector | A&R | road | label
});

// List all agents
const agents = await client.agents.list();

// Get agent details
const details = await client.agents.get(agentId);

// Delete an agent
await client.agents.delete(agentId);

// Update agent config
await client.agents.update(agentId, {
  skills: ['venue-finder', 'instant-split', 'setlist-oracle'],
});
```

### Messaging

```typescript
// Send a message (synchronous)
const response = await client.agents.message(agentId, {
  content: 'Find me a venue in London for 200 people this Saturday',
});

console.log(response.text);
console.log(response.toolCalls);  // any tool invocations

// Stream a message (real-time)
const stream = await client.agents.stream(agentId, {
  content: 'Analyze my latest royalty statements',
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

### Skills

```typescript
// Install a skill
await client.skills.install(agentId, 'venue-finder');

// List installed skills
const skills = await client.skills.list(agentId);

// Uninstall a skill
await client.skills.uninstall(agentId, 'venue-finder');

// Get skill details (tools, MCP config)
const skill = await client.skills.get('venue-finder');
console.log(skill.tools);      // available tool schemas
console.log(skill.mcpServer);  // MCP server config if present
```

### Wallet

```typescript
// Check agent wallet balance
const balance = await client.wallet.balance(agentId);
console.log(`$${balance.usdc} USDC on ${balance.network}`);

// Transfer USDC
await client.wallet.transfer(agentId, {
  to: '0xRecipient...',
  amount: 5.0,
  token: 'USDC',
});

// Deposit from external wallet
await client.wallet.deposit(agentId, {
  amount: 10,
  token: 'USDC',
  network: 'base',
});
```

### MCP Server

```typescript
import { McpServer } from '@agentbot/sdk/mcp';

// Create an MCP server for a skill
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
  const venues = await searchVenues(city, capacity);
  return {
    content: [{ type: 'text', text: JSON.stringify(venues) }],
  };
});

// Start the server
server.start({ transport: 'sse', port: 8402 });
```

## x402 Payment Examples

### Discovering Paid Services

```typescript
import { Agentbot, x402 } from '@agentbot/sdk';

const client = new Agentbot({ apiKey: process.env.AGENTBOT_API_KEY });

// Browse the Agentic Market for paid MCP services
const services = await client.marketplace.discover({
  category: 'data',
  maxPrice: 0.05,        // max price per call in USD
  network: 'base',
});

for (const svc of services) {
  console.log(`${svc.name} — $${svc.pricePerCall}/call`);
  console.log(`  Tools: ${svc.tools.map(t => t.name).join(', ')}`);
}
```

### Invoking Paid Tools

```typescript
// The SDK handles 402 negotiation automatically
const result = await client.mcp.invoke({
  service: 'gecko-data',
  tool: 'get_pool_data',
  args: {
    pool: '0xabc...',
    network: 'base',
  },
  payment: x402.auto(),  // pay transparently from agent wallet
});

console.log(result.data);
console.log(`Paid $${result.payment.amount} USDC`);
```

### Publishing a Paid MCP Service

```typescript
import { McpServer } from '@agentbot/sdk/mcp';
import { x402 } from '@agentbot/sdk';

const server = new McpServer({
  name: 'gecko-data',
  version: '1.0.0',
  // Define per-tool pricing
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
  const data = await fetch(`https://api.geckoterminal.com/api/v2/networks/${network}/pools/${pool}`);
  return { content: [{ type: 'text', text: await data.text() }] };
});

// Start — x402 payment headers are handled automatically
server.start({ transport: 'sse', port: 8402 });
```

### Setting Payment Limits

```typescript
// Set a daily spending cap for an agent
await client.wallet.setSpendLimit(agentId, {
  daily: 1.00,   // max $1/day
  perCall: 0.05,  // max $0.05 per individual call
  token: 'USDC',
});

// View payment history
const payments = await client.wallet.payments(agentId, {
  since: new Date('2026-06-01'),
  limit: 50,
});

for (const p of payments) {
  console.log(`${p.service}/${p.tool} — $${p.amount} at ${p.timestamp}`);
}
```

## Error Handling

```typescript
import { Agentbot, AgentbotError, PaymentRequiredError } from '@agentbot/sdk';

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
  } else if (err instanceof AgentbotError) {
    console.log(`API error: ${err.code} — ${err.message}`);
  }
}
```

## Configuration

```typescript
const client = new Agentbot({
  // Required
  apiKey: process.env.AGENTBOT_API_KEY,

  // Optional
  baseUrl: 'https://agentbot.sh',     // default
  timeout: 30_000,                     // request timeout in ms
  retries: 3,                          // auto-retry on 429/5xx
  wallet: {
    maxSpendPerCall: 0.05,             // safety limit
    maxSpendPerDay: 1.00,              // daily cap
  },
});
```

## License

MIT — see [LICENSE](../../LICENSE)
