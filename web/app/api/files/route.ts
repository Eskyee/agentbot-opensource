import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import path from 'path'
import { promises as fs } from 'fs'

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/agentbot-uploads'

/**
 * GET /api/files?agentId=xxx
 * List files for a given agent
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession()

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const downloadId = searchParams.get('download')

  // File download by ID
  if (downloadId) {
    try {
      const file = await prisma.agentFile.findFirst({
        where: { id: downloadId, userId: session.user.id },
      })
      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      // Validate path is within UPLOAD_DIR to prevent path traversal
      if (!file.path) {
        return NextResponse.json({ error: 'File path missing' }, { status: 500 })
      }
      const resolvedPath = path.resolve(file.path)
      const resolvedUploadDir = path.resolve(UPLOAD_DIR)
      if (!resolvedPath.startsWith(resolvedUploadDir)) {
        console.error('Path traversal attempt blocked:', file.path)
        return NextResponse.json({ error: 'Invalid file path' }, { status: 403 })
      }
      const buffer = await fs.readFile(resolvedPath)
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': file.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.filename)}"`,
          'Content-Length': String(file.size),
        },
      })
    } catch (error) {
      console.error('File download error:', error)
      return NextResponse.json({ error: 'Download failed' }, { status: 500 })
    }
  }

  // List files
  const agentId = searchParams.get('agentId')

  try {
    const where: Record<string, any> = { userId: session.user.id }
    if (agentId) where.agentId = agentId

    const files = await prisma.agentFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        url: true,
        size: true,
        mimeType: true,
        agentId: true,
        createdAt: true,
      },
    })

    const totalSize = files.reduce((sum, f) => sum + f.size, 0)

    return NextResponse.json({
      files,
      totalSize,
      count: files.length,
    })
  } catch (error) {
    console.error('Files list error:', error)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}

/**
 * POST /api/files
 * Upload a file for an agent
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession()

  if (!session?.user?.email || !session?.user?.id) {
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

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Check storage limit (user.storageLimit is in MB)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { storageLimit: true },
    })
    const existingFiles = await prisma.agentFile.aggregate({
      where: { userId: session.user.id },
      _sum: { size: true },
    })
    const usedBytes = existingFiles._sum.size || 0
    const limitBytes = (user?.storageLimit || 10) * 1024 * 1024
    if (usedBytes + file.size > limitBytes) {
      return NextResponse.json(
        { error: 'Storage limit exceeded. Upgrade your plan for more storage.' },
        { status: 413 }
      )
    }

    // Save file to disk
    const uploadDir = path.join(UPLOAD_DIR, session.user.id, agentId)
    await fs.mkdir(uploadDir, { recursive: true })

    // Sanitize filename: reject dotfiles, limit length, strip path traversal
    const baseName = file.name.replace(/^\.+/, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128)
    const safeFilename = baseName || `upload_${Date.now()}`
    const filePath = path.join(uploadDir, `${Date.now()}_${safeFilename}`)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    // Create database record (url updated after creation)
    const record = await prisma.agentFile.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        agentId,
        filename: file.name,
        path: filePath,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
      },
    })

    // Update URL with the record ID
    const downloadUrl = `/api/files?download=${record.id}`
    await prisma.agentFile.update({
      where: { id: record.id },
      data: { url: downloadUrl },
    })

    return NextResponse.json({
      success: true,
      file: {
        id: record.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: downloadUrl,
        uploaded: record.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

/**
 * DELETE /api/files
 * Delete a file
 */
export async function DELETE(req: NextRequest) {
  const session = await getAuthSession()

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { fileId } = await req.json()

    if (!fileId) {
      return NextResponse.json({ error: 'fileId required' }, { status: 400 })
    }

    // Verify file belongs to user
    const file = await prisma.agentFile.findFirst({
      where: { id: fileId, userId: session.user.id },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from disk
    if (file.path) {
      await fs.unlink(file.path).catch(() => {
        // File may already be deleted from disk
      })
    }

    // Delete from database
    await prisma.agentFile.delete({ where: { id: fileId } })

    return NextResponse.json({ success: true, fileId })
  } catch (error) {
    console.error('File delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}


export const dynamic = 'force-dynamic';