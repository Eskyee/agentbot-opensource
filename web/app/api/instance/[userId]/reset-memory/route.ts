import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

const RAILWAY_API = 'https://backboard.railway.app/graphql/v2'
const RAILWAY_TOKEN = process.env.RAILWAY_API_KEY || ''

/**
 * POST /api/instance/[userId]/reset-memory
 * Wipe workspace and restart. Agent starts fresh like new.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openclawInstanceId: true },
  })

  if (!user?.openclawInstanceId) {
    return NextResponse.json({ success: false, error: 'No instance found' }, { status: 404 })
  }

  try {
    // Clear agent memories from DB
    await prisma.agentMemory.deleteMany({
      where: { userId },
    })

    // Restart the container (workspace is ephemeral on Railway, so it resets on restart)
    await fetch(RAILWAY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      },
      body: JSON.stringify({
        query: `mutation ServiceInstanceRestart($serviceId: String!, $environmentId: String!) {
          serviceInstanceRestart(serviceId: $serviceId, environmentId: $environmentId)
        }`,
        variables: {
          serviceId: user.openclawInstanceId,
          environmentId: process.env.RAILWAY_ENVIRONMENT_ID || '',
        },
      }),
    })

    return NextResponse.json({ success: true, status: 'reset' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
