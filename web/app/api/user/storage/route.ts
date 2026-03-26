import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, plan: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Storage limits by plan
    const limits: Record<string, number> = {
      free: 10,
      starter: 50,
      pro: 500,
      scale: 2000,
      enterprise: 10000,
      white_glove: 50000
    }

    const storageLimit = limits[user.plan] || 10

    return NextResponse.json({
      storageLimit,
      plan: user.plan,
      used: 0,
      available: storageLimit
    })
  } catch (error) {
    console.error('Storage fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch storage' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const agentId = formData.get('agentId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!agentId) {
      return NextResponse.json({ error: 'No agentId provided' }, { status: 400 })
    }

    // For now, just acknowledge the upload
    // Full implementation would store to S3, local disk, or similar
    const fileName = file.name
    const fileSize = file.size

    return NextResponse.json({
      success: true,
      file: {
        name: fileName,
        size: fileSize,
        uploaded: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}


export const dynamic = 'force-dynamic';