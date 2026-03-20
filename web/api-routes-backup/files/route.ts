export const dynamic = "force-static"
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

/**
 * File Upload/Download API - STUBBED
 * 
 * TODO: Implement database layer + storage
 * - Store file metadata in database
 * - Upload to S3/local storage
 * - Download with proper headers
 * - Track file usage
 * - Delete old files
 */

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('agentId') || 'default'

  // STUBBED: Return empty list
  return NextResponse.json({
    files: [],
    agentId,
    message: 'File storage database integration pending',
    totalSize: 0,
    count: 0
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
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
      return NextResponse.json({ error: 'agentId required' }, { status: 400 })
    }

    // STUBBED: Just acknowledge the upload
    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        uploaded: new Date().toISOString(),
        message: 'File metadata will be stored once database is ready'
      }
    }, { status: 201 })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { fileId } = await req.json()

    if (!fileId) {
      return NextResponse.json({ error: 'fileId required' }, { status: 400 })
    }

    // STUBBED: Just acknowledge the deletion
    return NextResponse.json({
      success: true,
      fileId,
      message: 'File deletion will be processed once database is ready'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
