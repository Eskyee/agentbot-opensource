import { NextResponse, NextRequest } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

// Runs are not yet stored in the database — return empty until we add run tracking
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params

  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add run tracking to Prisma schema and populate here
    return NextResponse.json({ runs: [], agentId })
  } catch (error) {
    console.error('Agent runs error:', error)
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 })
  }
}
