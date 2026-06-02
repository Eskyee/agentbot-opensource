/**
 * Vercel-native agent provisioning — no Railway required.
 *
 * Instead of creating Railway containers, this provisions agents as:
 * 1. Database records (agent config, skills, channels)
 * 2. OpenClaw config stored in user settings
 * 3. Optional: self-hosted Docker Compose for users who want their own runtime
 *
 * POST /api/agents/provision-vercel
 *   Body: { plan, channels?, model? }
 *   Returns: { success, agentId, dashboardUrl, mode }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Default MiMo config for all new agents
const DEFAULT_CONFIG = {
  model: {
    primary: 'xiaomi/mimo-v2.5-pro',
    fallbacks: ['xiaomi/mimo-v2.5', 'anthropic/claude-sonnet-4-5'],
  },
  providers: {
    xiaomi: {
      baseUrl: 'https://token-plan-ams.xiaomimimo.com/v1',
      apiKey: process.env.MIMO_API_KEY || '',
      api: 'openai-completions',
    },
  },
  maxTokens: 32000,
  contextWindow: 1048576,
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { plan?: string; channels?: string[]; model?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const plan = body.plan || 'solo'
  const channels = body.channels || ['telegram']
  const model = body.model || DEFAULT_CONFIG.model.primary

  // Check plan limits
  const planLimits: Record<string, number> = {
    solo: 1,
    collective: 3,
    label: 10,
    network: 999,
  }
  const maxAgents = planLimits[plan] || 1

  // Count existing agents
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { agents: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.agents.length >= maxAgents) {
    return NextResponse.json(
      { error: `Plan limit reached (${maxAgents} agents on ${plan} plan)` },
      { status: 403 }
    )
  }

  // Create agent record
  const agentId = crypto.randomUUID()
  const agent = await prisma.agent.create({
    data: {
      id: agentId,
      userId: user.id,
      name: `agent-${agentId.slice(0, 8)}`,
      status: 'active',
      model: model,
      plan: plan,
      config: JSON.stringify({
        ...DEFAULT_CONFIG,
        model: { ...DEFAULT_CONFIG.model, primary: model },
      }),
      channels: JSON.stringify(channels),
    },
  })

  // Generate OpenClaw config for self-hosting
  const openclawConfig = {
    agents: {
      defaults: {
        model: {
          primary: `xiaomi-coding/${model}`,
          fallbacks: DEFAULT_CONFIG.model.fallbacks,
        },
      },
      list: [
        {
          id: 'main',
          name: 'Agent',
          model: {
            primary: `xiaomi-coding/${model}`,
            fallbacks: DEFAULT_CONFIG.model.fallbacks,
          },
        },
      ],
    },
    models: {
      providers: {
        'xiaomi-coding': {
          baseUrl: DEFAULT_CONFIG.providers.xiaomi.baseUrl,
          apiKey: DEFAULT_CONFIG.providers.xiaomi.apiKey,
          api: 'openai-completions',
          models: [
            {
              id: 'mimo-v2.5-pro',
              name: 'MiMo-V2.5-Pro',
              contextWindow: 1048576,
              reasoning: true,
              input: ['text'],
              maxTokens: 32000,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            },
            {
              id: 'mimo-v2.5',
              name: 'MiMo-V2.5',
              contextWindow: 262144,
              reasoning: true,
              input: ['text', 'image'],
              maxTokens: 32000,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            },
          ],
        },
      },
    },
  }

  return NextResponse.json({
    success: true,
    agentId: agent.id,
    agentName: agent.name,
    dashboardUrl: `/dashboard`,
    mode: 'vercel-native',
    plan,
    channels,
    model,
    openclawConfig,
    message: 'Agent provisioned. Use the Vercel Gateway for inference, or self-host with Docker Compose.',
  })
}
