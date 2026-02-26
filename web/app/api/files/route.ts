import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { put, list } from '@vercel/blob'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId') || 'default'

  try {
    const files = await list({ prefix: `files/${agentId}/` })
    
    return NextResponse.json({ 
      files: files.blobs.map(blob => ({
        name: blob.pathname.split('/').pop(),
        size: blob.size,
        url: blob.url,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ files: [], error: error.message })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const agentId = formData.get('agentId') as string || 'default'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })
    
    const buffer = Buffer.from(await file.arrayBuffer())
    
    const blob = await put(`files/${agentId}/${file.name}`, buffer, {
      access: 'public',
    })

    await prisma.agentFile.create({
      data: {
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        url: blob.url,
        agentId,
        userId: user?.id || 'unknown',
        userEmail: session.user.email,
      }
    })

    return NextResponse.json({ 
      success: true,
      filename: file.name,
      size: file.size,
      url: blob.url,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
