import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

const SAMPLE_SWARMS = [
  {
    id: '1',
    name: 'Customer Support Team',
    description: '3 agents working together: Triage, Technical, Escalation',
    agents: [
      { role: 'triage', model: 'gpt-4o-mini', prompt: 'Classify customer inquiries' },
      { role: 'technical', model: 'claude-3.5-sonnet', prompt: 'Answer technical questions' },
      { role: 'escalation', model: 'gpt-4o', prompt: 'Handle complex issues' }
    ],
    enabled: true
  }
]

export async function GET() {
  return NextResponse.json({ swarms: SAMPLE_SWARMS })
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, description, agents } = await request.json()
  
  // TODO: Save to AgentSwarm table
  return NextResponse.json({ success: true })
}
