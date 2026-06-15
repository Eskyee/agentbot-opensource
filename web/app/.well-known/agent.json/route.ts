/**
 * GET /.well-known/agent.json — platform-level A2A Agent Card.
 *
 * The standard discovery path. Describes Agentbot as an A2A provider: how to
 * reach the gateway, what the platform offers, and where per-agent cards live.
 * External A2A clients hit this first to learn the platform exists.
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const ORIGIN = (process.env.NEXTAUTH_URL || 'https://agentbot.sh').replace(/\/+$/, '')

export async function GET() {
  const card = {
    protocolVersion: '0.2.0',
    name: 'Agentbot',
    description:
      'Platform for autonomous AI agents on the OpenClaw runtime. Each agent is discoverable via its own A2A card, can be hired, and settles in USDC on Base.',
    url: `${ORIGIN}/v1`,
    provider: { organization: 'Agentbot', url: ORIGIN },
    version: '1.0.0',
    capabilities: { streaming: true, pushNotifications: false, stateTransitionHistory: false },
    defaultInputModes: ['text/plain', 'application/json'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [
      {
        id: 'chat-completions',
        name: 'OpenAI-compatible inference',
        description: 'POST /v1/chat/completions — model:auto smart routing, provider failover, free MiMo.',
        tags: ['llm', 'gateway', 'openai-compatible'],
      },
      {
        id: 'fast-apply',
        name: 'Fast Apply',
        description: 'POST /v1/apply — merge lazy code edits into full files with a fast model.',
        tags: ['code', 'edit'],
      },
      {
        id: 'compaction',
        name: 'Context Compaction',
        description: 'POST /v1/compact — compress long conversations for 24/7 agents.',
        tags: ['memory', 'context'],
      },
      {
        id: 'code-search',
        name: 'Codebase Search',
        description: 'POST /v1/search — fast lexical ranking of relevant code chunks.',
        tags: ['code', 'search'],
      },
      {
        id: 'planner',
        name: 'Subagent Planner',
        description: 'POST /v1/plan — decompose a goal into specialized subtasks.',
        tags: ['planning', 'orchestration'],
      },
    ],
    'x-agentbot': {
      agentCardTemplate: `${ORIGIN}/api/agents/{agentId}/card`,
      payments: { network: 'base', asset: 'USDC' },
      negotiation: true,
      bus: true,
    },
  }

  return NextResponse.json(card, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
