#!/usr/bin/env node
/**
 * Agentbot MCP Server
 *
 * Exposes Agentbot's AI inference, x402 payments, and skill tools
 * via the Model Context Protocol (MCP).
 *
 * Usage:
 *   npx agentbot-mcp
 *   # or
 *   node dist/index.js
 *
 * Environment:
 *   AGENTBOT_API_KEY    — API key for Agentbot (from Settings → API Keys)
 *   MIMO_API_KEY        — MiMo subscription key (for direct inference)
 *   X402_PRIVATE_KEY    — Private key for x402 payments (optional)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const AGENTBOT_URL = process.env.AGENTBOT_URL || 'https://agentbot.sh'
const MIMO_BASE_URL = process.env.MIMO_BASE_URL || 'https://token-plan-ams.xiaomimimo.com/v1'
const MIMO_API_KEY = process.env.MIMO_API_KEY || ''
const AGENTBOT_API_KEY = process.env.AGENTBOT_API_KEY || ''

// Create MCP server
const server = new McpServer({
  name: 'agentbot-mcp',
  version: '1.0.0',
})

// ═══════════════════════════════════════════════
// Tool: Chat Completion (MiMo V2.5 Pro)
// ═══════════════════════════════════════════════
server.tool(
  'chat',
  'Send a chat completion request to MiMo V2.5 Pro via Agentbot',
  {
    messages: z.array(z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })).describe('Chat messages'),
    model: z.string().optional().describe('Model ID (default: mimo-v2.5-pro)'),
    max_tokens: z.number().optional().describe('Max tokens to generate'),
    temperature: z.number().optional().describe('Temperature (0-2)'),
  },
  async ({ messages, model, max_tokens, temperature }) => {
    const apiKey = MIMO_API_KEY || AGENTBOT_API_KEY
    if (!apiKey) {
      return { content: [{ type: 'text', text: 'Error: No API key configured. Set MIMO_API_KEY or AGENTBOT_API_KEY.' }] }
    }

    try {
      const res = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'api-key': apiKey,
        },
        body: JSON.stringify({
          model: model || 'mimo-v2.5-pro',
          messages,
          max_tokens: max_tokens || 4096,
          temperature,
        }),
        signal: AbortSignal.timeout(30_000),
      })

      if (!res.ok) {
        const err = await res.text().catch(() => '')
        return { content: [{ type: 'text', text: `Error ${res.status}: ${err.slice(0, 500)}` }] }
      }

      const data = await res.json() as any
      const content = data.choices?.[0]?.message?.content || 'No response'
      const usage = data.usage ? `\n\nTokens: ${usage.prompt_tokens} in / ${usage.completion_tokens} out` : ''

      return { content: [{ type: 'text', text: content + usage }] }
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : 'Unknown'}` }] }
    }
  }
)

// ═══════════════════════════════════════════════
// Tool: List Models
// ═══════════════════════════════════════════════
server.tool(
  'list_models',
  'List available MiMo models on Agentbot',
  {},
  async () => {
    try {
      const res = await fetch(`${AGENTBOT_URL}/v1/models`, {
        headers: AGENTBOT_API_KEY ? { 'Authorization': `Bearer ${AGENTBOT_API_KEY}` } : {},
        signal: AbortSignal.timeout(10_000),
      })

      if (!res.ok) {
        return { content: [{ type: 'text', text: `Error ${res.status}` }] }
      }

      const data = await res.json() as any
      const models = data.data?.map((m: any) => `- ${m.id} (${m.owned_by || 'unknown'})`).join('\n') || 'No models found'

      return { content: [{ type: 'text', text: `Available models:\n${models}` }] }
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : 'Unknown'}` }] }
    }
  }
)

// ═══════════════════════════════════════════════
// Tool: x402 Discover Services
// ═══════════════════════════════════════════════
server.tool(
  'x402_discover',
  'Discover paid services on Agentic Market (x402 protocol)',
  {
    query: z.string().optional().describe('Search query'),
    category: z.string().optional().describe('Category: Inference, Data, Media, Infra, Search'),
    limit: z.number().optional().describe('Max results (default: 10)'),
  },
  async ({ query, category, limit }) => {
    try {
      let url = 'https://api.agentic.market/v1/services'
      if (query) url = `https://api.agentic.market/v1/services/search?q=${encodeURIComponent(query)}`

      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
      if (!res.ok) {
        return { content: [{ type: 'text', text: `Error ${res.status}` }] }
      }

      const data = await res.json() as any
      let services = data.services || []

      if (category) {
        services = services.filter((s: any) => s.category?.toLowerCase() === category.toLowerCase())
      }

      services = services.slice(0, limit || 10)

      const formatted = services.map((s: any) =>
        `**${s.name}** (${s.category || '?'})\n  ${s.description?.slice(0, 100) || 'No description'}\n  Networks: ${s.networks?.join(', ') || '?'}\n  Endpoints: ${s.endpoints?.length || 0}`
      ).join('\n\n') || 'No services found'

      return { content: [{ type: 'text', text: `Found ${services.length} services:\n\n${formatted}` }] }
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : 'Unknown'}` }] }
    }
  }
)

// ═══════════════════════════════════════════════
// Tool: Health Check
// ═══════════════════════════════════════════════
server.tool(
  'health',
  'Check Agentbot platform health',
  {},
  async () => {
    try {
      const [main, gateway, models] = await Promise.all([
        fetch(`${AGENTBOT_URL}`, { signal: AbortSignal.timeout(5000) }).then(r => r.status).catch(() => 'down'),
        fetch(`${AGENTBOT_URL}/vercel-gateway/health`, { signal: AbortSignal.timeout(5000) }).then(r => r.status).catch(() => 'down'),
        fetch(`${AGENTBOT_URL}/v1/models`, { signal: AbortSignal.timeout(5000) }).then(r => r.status).catch(() => 'down'),
      ])

      return {
        content: [{
          type: 'text',
          text: `Agentbot Health:\n  Main: ${main}\n  Gateway: ${gateway}\n  Models: ${models}`
        }]
      }
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : 'Unknown'}` }] }
    }
  }
)

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Agentbot MCP Server running on stdio')
}

main().catch(console.error)
