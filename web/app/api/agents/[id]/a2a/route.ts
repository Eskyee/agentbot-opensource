/**
 * /api/agents/:id/a2a — inbound A2A task endpoint (JSON-RPC 2.0).
 *
 * The action side of A2A Agent Cards: an external agent that discovered this
 * agent's card can now send it work. Implements the core `message/send` method
 * — the task runs through the Agentbot gateway as this agent (identity + skills
 * in the system prompt) and returns an A2A Message.
 *
 * Discovery gate: only showcase-opted agents accept inbound tasks.
 * Payment: if the agent has a wallet, a payment-signature header is required
 * (x402); the card advertises the rail so callers know to pay. GET returns the
 * agent card for convenience.
 */
import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { buildAgentCard } from '@/app/lib/agent-card'
import {
  gatewayCorsHeaders,
  gatewayUpstreamHeaders,
  normalizeGatewayModel,
  resolveGatewayUpstreams,
  shouldTryNextGatewayUpstream,
} from '@/app/lib/opengateway'
import { checkRateLimit } from '@/app/lib/api/rate-limit'
import { verifyX402Payment } from '@/app/lib/x402-verify'
import {
  createTask,
  getTask,
  markWorking,
  completeTask,
  failTask,
  toA2ATask,
} from '@/app/lib/a2a-tasks'

// USDC contract per chain (smallest unit; USDC = 6 decimals)
const USDC_BY_NETWORK: Record<string, { asset: string; caip2: string }> = {
  base: { asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', caip2: 'eip155:8453' },
  'base-sepolia': { asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', caip2: 'eip155:84532' },
}
// Default A2A task price: 0.001 USDC (6 decimals)
const A2A_MIN_AMOUNT = 1000n

export const runtime = 'nodejs'
export const maxDuration = 60

type JsonRpcId = string | number | null

function rpcResult(id: JsonRpcId, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result }, { headers: gatewayCorsHeaders() })
}
function rpcError(id: JsonRpcId, code: number, message: string, status = 200) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }, { status, headers: gatewayCorsHeaders() })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: gatewayCorsHeaders() })
}

async function loadAgent(id: string) {
  return prisma.agent
    .findUnique({
      where: { id },
      include: { installedSkills: { include: { skill: true } } },
    })
    .catch(() => null)
}

// GET → the agent card (same shape as /card), convenient for A2A clients.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const agent = await loadAgent(id.trim())
  if (!agent || !agent.showcaseOptIn) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404, headers: gatewayCorsHeaders() })
  }
  const wallet = await prisma.wallet
    .findFirst({ where: { userId: agent.userId }, select: { address: true, network: true } })
    .catch(() => null)
  const card = buildAgentCard(
    {
      id: agent.id,
      name: agent.name,
      model: agent.model,
      status: agent.status,
      showcaseDescription: agent.showcaseDescription,
      installedSkills: agent.installedSkills.map((s) => ({
        enabled: s.enabled,
        skill: { name: s.skill.name, description: s.skill.description, category: s.skill.category },
      })),
    },
    wallet ? { walletAddress: wallet.address, network: wallet.network } : undefined,
  )
  return NextResponse.json(card, { headers: gatewayCorsHeaders() })
}

function extractText(message: unknown): string {
  if (!message || typeof message !== 'object') return ''
  const parts = (message as { parts?: unknown }).parts
  if (!Array.isArray(parts)) return ''
  return parts
    .map((p) => (p && typeof p === 'object' && typeof (p as { text?: unknown }).text === 'string' ? (p as { text: string }).text : ''))
    .filter(Boolean)
    .join('\n')
    .slice(0, 8_000)
}

function agentSystemPrompt(agent: { name: string; installedSkills: Array<{ enabled: boolean; skill: { name: string; description: string } }> }) {
  const skills = agent.installedSkills
    .filter((s) => s.enabled)
    .map((s) => `- ${s.skill.name}: ${s.skill.description}`)
    .join('\n')
  return [
    `You are "${agent.name}", an autonomous Agentbot agent responding to an A2A task from another agent.`,
    'Answer the task directly and concisely. If it is outside your skills, say so plainly.',
    skills ? `Your skills:\n${skills}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

type LoadedAgent = NonNullable<Awaited<ReturnType<typeof loadAgent>>>

/** Run the task through the gateway as this agent. Returns reply or throws. */
async function runAgentTask(agent: LoadedAgent, taskText: string): Promise<string> {
  const upstreams = resolveGatewayUpstreams()
  if (upstreams.length === 0) throw new Error('No model backend configured')
  const model = agent.model || 'mimo-v2.5-pro'
  let lastFailure = ''

  for (const upstream of upstreams) {
    try {
      const response = await fetch(`${upstream.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: gatewayUpstreamHeaders(upstream, `Agentbot A2A · ${agent.name}`),
        body: JSON.stringify({
          model: normalizeGatewayModel(model, upstream.provider),
          messages: [
            { role: 'system', content: agentSystemPrompt(agent) },
            { role: 'user', content: taskText },
          ],
          temperature: 0.4,
          max_tokens: 2_000,
          ...(upstream.provider === 'openrouter' ? { reasoning: { max_tokens: 0 } } : {}),
        }),
        signal: AbortSignal.timeout(50_000),
      })
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        lastFailure = `${upstream.provider} ${response.status}${text ? `: ${text.slice(0, 160)}` : ''}`
        if (shouldTryNextGatewayUpstream(response.status)) continue
        break
      }
      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
      const reply = data.choices?.[0]?.message?.content ?? ''
      if (reply.trim()) return reply
      lastFailure = `${upstream.provider} returned empty reply`
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : 'request failed'
    }
  }
  throw new Error(lastFailure || 'agent could not complete the task')
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // A2A tasks run the model → AI-category rate limit
  if (await checkRateLimit(req, 'ai')) {
    return rpcError(null, -32029, 'Rate limit exceeded', 429)
  }

  const { id } = await params
  const agent = await loadAgent(id.trim())
  if (!agent || !agent.showcaseOptIn) {
    return rpcError(null, -32004, 'Agent not found or not discoverable', 404)
  }

  let rpc: { id?: JsonRpcId; method?: unknown; params?: unknown }
  try {
    rpc = await req.json()
  } catch {
    return rpcError(null, -32700, 'Parse error')
  }
  const rpcId: JsonRpcId = (rpc.id as JsonRpcId) ?? null
  const method = typeof rpc.method === 'string' ? rpc.method : ''

  // Polling a task's status is free (no payment) — handle before the gate.
  if (method === 'tasks/get') {
    const taskId = (rpc.params as { id?: unknown })?.id
    if (typeof taskId !== 'string' || !taskId) return rpcError(rpcId, -32602, 'tasks/get requires params.id')
    const task = await getTask(taskId)
    if (!task || task.contextId !== `a2a-${agent.id}`) return rpcError(rpcId, -32001, 'Task not found', 404)
    return rpcResult(rpcId, toA2ATask(task))
  }

  // Payment gate: agents with a wallet require an x402 payment signature.
  const wallet = await prisma.wallet
    .findFirst({ where: { userId: agent.userId }, select: { address: true, network: true } })
    .catch(() => null)
  if (wallet) {
    const usdc = USDC_BY_NETWORK[wallet.network] ?? USDC_BY_NETWORK.base
    const paid = req.headers.get('payment-signature') || req.headers.get('PAYMENT-SIGNATURE')
    const verdict = verifyX402Payment(paid, {
      payTo: wallet.address,
      asset: usdc.asset,
      network: usdc.caip2,
      minAmount: A2A_MIN_AMOUNT,
    })
    if (!verdict.valid) {
      return rpcError(
        rpcId,
        -32003,
        `Payment required (${verdict.reason}): authorize ≥ ${A2A_MIN_AMOUNT} USDC (smallest unit) to ${wallet.address} on ${usdc.caip2}, then resend with a payment-signature header.`,
        402,
      )
    }
  }

  if (method !== 'message/send' && method !== 'tasks/send') {
    return rpcError(rpcId, -32601, `Method not supported: ${method || '(none)'}. Use message/send or tasks/get.`)
  }

  const paramsObj = (rpc.params ?? {}) as { message?: unknown; configuration?: { blocking?: unknown } }
  const taskText = extractText(paramsObj.message)
  if (!taskText.trim()) {
    return rpcError(rpcId, -32602, 'Invalid params: message.parts must contain text')
  }

  if (resolveGatewayUpstreams().length === 0) {
    return rpcError(rpcId, -32011, 'No model backend configured', 503)
  }

  // Non-blocking mode (A2A configuration.blocking === false): persist a
  // submitted task, run it in the background, and let the client poll tasks/get.
  // Decouples completion from the 60s response window. (Background work is still
  // bounded by maxDuration; swap the runner for the bus worker for unbounded.)
  const blocking = paramsObj.configuration?.blocking !== false
  if (!blocking) {
    const task = await createTask(`a2a-${agent.id}`)
    after(async () => {
      try {
        await markWorking(task.id)
        const reply = await runAgentTask(agent, taskText)
        await completeTask(task.id, reply)
      } catch (error) {
        await failTask(task.id, error instanceof Error ? error.message : 'task failed')
      }
    })
    return rpcResult(rpcId, toA2ATask(task))
  }

  // Blocking mode: run synchronously and return the completed task.
  try {
    const replyText = await runAgentTask(agent, taskText)
    const now = new Date().toISOString()
    return rpcResult(rpcId, {
      id: `task-${Date.now().toString(36)}`,
      contextId: `a2a-${agent.id}`,
      status: { state: 'completed', timestamp: now },
      history: [],
      artifacts: [],
      message: {
        role: 'agent',
        parts: [{ kind: 'text', text: replyText }],
        messageId: `msg-${Date.now().toString(36)}`,
      },
      kind: 'task',
    })
  } catch (error) {
    return rpcError(rpcId, -32010, `Agent could not complete the task. ${error instanceof Error ? error.message : ''}`, 502)
  }
}
