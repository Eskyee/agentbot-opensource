import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Return empty scheduled tasks by default
    return NextResponse.json({
      tasks: [],
      count: 0,
      message: 'No scheduled tasks'
    })
  } catch (error) {
    console.error('Scheduled tasks fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, description, schedule, agentId } = await req.json()

    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 })
    }

    // Create task
    return NextResponse.json({
      id: 'task_' + Date.now(),
      title,
      description,
      schedule,
      agentId,
      status: 'scheduled',
      created: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Task creation error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
