import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

// GET /api/export — Export all user data as JSON
export async function GET() {
  try {
    const session = await getAuthSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch all user data from models that exist in the schema
    const [user, agents, scheduledTasks, workflows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          role: true,
          referralCode: true,
          referralCredits: true,
        },
      }),
      prisma.agent.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          model: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.scheduledTask.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          cronSchedule: true,
          enabled: true,
          createdAt: true,
        },
      }),
      prisma.workflow.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          enabled: true,
          createdAt: true,
        },
      }),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      user,
      agents,
      scheduledTasks,
      workflows,
    }

    // Return as downloadable JSON
    const filename = `agentbot-export-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Export failed', message: error.message },
      { status: 500 }
    )
  }
}
