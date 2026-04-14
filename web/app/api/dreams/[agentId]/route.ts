import { NextRequest, NextResponse } from 'next/server'
import { getAgentDreams } from '@/lib/agentbot/dreams'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params
  const result = await getAgentDreams(agentId)
  return NextResponse.json(result)
}
