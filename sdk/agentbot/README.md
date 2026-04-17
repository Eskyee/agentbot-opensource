# `@agentbot/sdk`

Minimal TypeScript SDK starter for the public Agentbot API in this repository.

This package is intentionally small:

- no generated client code
- no managed-platform internals
- no private deployment assumptions

## Covered routes

- `GET /health`
- `GET /api/agents`
- `GET /api/agents/:id`
- `POST /api/agents`
- `PUT /api/agents/:id`
- `DELETE /api/agents/:id`
- `POST /api/provision`

## Usage

```ts
import { createAgentbotClient } from './index'

const client = createAgentbotClient({
  baseUrl: 'http://localhost:3001',
  apiKey: process.env.AGENTBOT_API_KEY,
})

const health = await client.getHealth()
const agent = await client.createAgent({
  name: 'basefm-agent',
  config: {
    plan: 'solo',
    aiProvider: 'openrouter',
  },
})
```
