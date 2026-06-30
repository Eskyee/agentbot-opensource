import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import path from 'path'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const MIME_TO_TYPE: Record<string, string> = {
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'application/json': 'json',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'docx',
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const docs = await prisma.knowledgeDocument.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: { agent: { select: { name: true } } },
    })

    const formatted = docs.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      size: d.size,
      chunks: d.chunks,
      status: d.status,
      agentId: d.agentId,
      agentName: d.agent?.name ?? null,
      uploadedAt: d.createdAt.toISOString(),
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('[Knowledge API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const agentId = formData.get('agentId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
    }

    const ext = path.extname(file.name).toLowerCase().slice(1)
    const docType = MIME_TO_TYPE[file.type] || ext || 'txt'

    // Store file bytes in the DB — the serverless filesystem is read-only.
    const buffer = Buffer.from(await file.arrayBuffer())

    // Create DB record
    const doc = await prisma.knowledgeDocument.create({
      data: {
        userId: session.user.id,
        agentId: agentId || null,
        name: file.name,
        type: docType,
        size: file.size,
        content: buffer,
        status: 'processing',
        chunks: 0,
      },
    })

    // Log to audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        agentId: agentId || null,
        action: 'document_uploaded',
        category: 'config',
        detail: `Uploaded "${file.name}" (${docType}, ${file.size} bytes)`,
        metadata: { docId: doc.id, type: docType, size: file.size },
      },
    })

    // TODO: Trigger async chunking + embedding pipeline
    // For now, estimate chunks based on file size
    const estimatedChunks = Math.max(1, Math.ceil(file.size / 1000))
    await prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: { status: 'ready', chunks: estimatedChunks },
    })

    return NextResponse.json({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      chunks: estimatedChunks,
      status: 'ready',
      agentId: doc.agentId,
      agentName: null,
      uploadedAt: doc.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('[Knowledge API] Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing document id' }, { status: 400 })
  }

  try {
    const doc = await prisma.knowledgeDocument.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Content lives in the row, so it's removed by the delete below.
    await prisma.knowledgeDocument.delete({ where: { id } })

    // Log to audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'document_deleted',
        category: 'config',
        detail: `Deleted "${doc.name}"`,
        metadata: { docId: id },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Knowledge API] Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
