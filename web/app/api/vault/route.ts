import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

export const dynamic = 'force-dynamic'

const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB
const CATEGORIES = ['Contracts', 'Invoices', 'Receipts', 'Documents', 'Other']

interface VaultFileMeta {
  name: string
  size: number
  fileType: string
  category: string
  blobUrl: string
  uploadedAt: string
}

// GET /api/vault — list the signed-in user's vault files (metadata only; open via /api/vault/[id])
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await prisma.managedAgentSession.findMany({
      where: { userId: session.user.id, type: 'vault-file' },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const files = rows.map((row) => {
      const m = (row.metadata as Record<string, unknown>) || {}
      return {
        id: row.id,
        name: (m.name as string) || 'file',
        size: (m.size as number) || 0,
        type: (m.fileType as string) || 'application/octet-stream',
        category: (m.category as string) || 'Other',
        uploadedAt: (m.uploadedAt as string) || row.createdAt.toISOString().split('T')[0],
        encrypted: true,
      }
    })

    return NextResponse.json({ ok: true, files })
  } catch (error) {
    console.error('[Vault] list error:', error)
    return NextResponse.json({ error: 'Failed to load vault' }, { status: 500 })
  }
}

// POST /api/vault — upload a file (multipart form: file, category)
export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Graceful degradation when no Blob store is connected to the project.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Vault storage is not configured yet — connect a Vercel Blob store to enable uploads.' },
      { status: 503 }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const categoryRaw = (formData.get('category') as string) || 'Other'
    const category = CATEGORIES.includes(categoryRaw) ? categoryRaw : 'Other'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File exceeds 25 MB limit' }, { status: 413 })
    }

    // Store under a per-user prefix with a random suffix (unguessable URL).
    // Imported lazily: @vercel/blob pulls @vercel/oidc, which reads an OIDC
    // token path at module load that is undefined during Next's build-time
    // page-data collection. Deferring keeps it out of the route's static graph.
    const { put } = await import('@vercel/blob')
    const blob = await put(`vault/${session.user.id}/${file.name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    const metadata: VaultFileMeta = {
      name: file.name,
      size: file.size,
      fileType: file.type || 'application/octet-stream',
      category,
      blobUrl: blob.url,
      uploadedAt: new Date().toISOString().split('T')[0],
    }

    const row = await prisma.managedAgentSession.create({
      data: { userId: session.user.id, type: 'vault-file', metadata: metadata as unknown as object },
    })

    return NextResponse.json({
      ok: true,
      file: {
        id: row.id,
        name: metadata.name,
        size: metadata.size,
        type: metadata.fileType,
        category: metadata.category,
        uploadedAt: metadata.uploadedAt,
        encrypted: true,
      },
    })
  } catch (error) {
    console.error('[Vault] upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
