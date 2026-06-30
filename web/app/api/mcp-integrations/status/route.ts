import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getAllConnections } from '@/app/lib/mcp-integrations'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connections = await getAllConnections(session.user.id)
  return NextResponse.json({ connections })
}
