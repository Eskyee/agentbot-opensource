import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')

  // TODO: Fetch from AgentMemory table
  const memory = {
    personality: 'professional',
    tone: 'formal',
    greeting: 'Hello! How can I assist you today?',
    expertise: 'general'
  }

  return NextResponse.json({ memory })
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { agentId, key, value } = await request.json()

  // TODO: Save to AgentMemory table
  return NextResponse.json({ success: true })
}
