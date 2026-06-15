import { NextRequest, NextResponse } from 'next/server'
import {
  findProducerAgent,
  findToolkitPrompt,
  masterCreatorSystemPrompt,
  producerAgents,
  toolkitPrompts,
} from '@/app/lib/creator-toolkit'

export const runtime = 'nodejs'

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export async function GET() {
  return NextResponse.json({
    masterSystemPrompt: masterCreatorSystemPrompt,
    agents: producerAgents.map(({ id, name, role, bpm, output }) => ({ id, name, role, bpm, output })),
    prompts: toolkitPrompts.map(({ id, title, category, summary }) => ({ id, title, category, summary })),
  })
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const agent = findProducerAgent(asString(body.agentId, 'break-architect'))
  const prompt = findToolkitPrompt(asString(body.promptId, 'jungle-arrangement'))
  const projectContext = asString(body.context).trim().slice(0, 3000)

  if (!agent) {
    return NextResponse.json({ error: 'Unknown producer agent' }, { status: 404 })
  }
  if (!prompt) {
    return NextResponse.json({ error: 'Unknown toolkit prompt' }, { status: 404 })
  }

  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      bpm: agent.bpm,
      output: agent.output,
    },
    prompt: {
      id: prompt.id,
      title: prompt.title,
      category: prompt.category,
      summary: prompt.summary,
    },
    messages: [
      { role: 'system', content: agent.systemPrompt },
      {
        role: 'user',
        content: `${prompt.prompt}${projectContext ? `\n\nProject context:\n${projectContext}` : ''}`,
      },
    ],
  })
}
