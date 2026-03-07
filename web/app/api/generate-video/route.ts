import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { topic, prompt, duration } = await req.json()

    if (!topic) {
      return NextResponse.json({ error: 'Topic required' }, { status: 400 })
    }

    // Queue video generation
    // Full implementation would use Mux or similar service
    return NextResponse.json({
      id: 'video_' + Date.now(),
      topic,
      prompt,
      duration: duration || '60',
      status: 'queued',
      estimatedTime: '5-10 minutes',
      created: new Date().toISOString()
    }, { status: 202 })
  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json({ error: 'Failed to generate video' }, { status: 500 })
  }
}
