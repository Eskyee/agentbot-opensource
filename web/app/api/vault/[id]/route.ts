import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

export const dynamic = 'force-dynamic'

async function loadOwnedFile(id: string, userId: string) {
  const row = await prisma.managedAgentSession.findUnique({ where: { id } })
  if (!row || row.userId !== userId || row.type !== 'vault-file') return null
  return row
}

// GET /api/vault/[id] — open/download: ownership-checked redirect to the stored blob.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const row = await loadOwnedFile(id, session.user.id)
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const blobUrl = (row.metadata as Record<string, unknown>)?.blobUrl as string | undefined
  if (!blobUrl) {
    return NextResponse.json({ error: 'File content unavailable' }, { status: 404 })
  }

  // Redirect to the unguessable blob URL only after confirming ownership.
  return NextResponse.redirect(blobUrl)
}

// DELETE /api/vault/[id] — remove the blob and its metadata row.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const row = await loadOwnedFile(id, session.user.id)
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const blobUrl = (row.metadata as Record<string, unknown>)?.blobUrl as string | undefined
  if (blobUrl && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      // Lazy import: @vercel/blob -> @vercel/oidc reads an OIDC token path at
      // module load that is undefined during the build. Defer to runtime.
      const { del } = await import('@vercel/blob')
      await del(blobUrl)
    } catch (err) {
      console.error('[Vault] blob delete failed:', err)
      // Still remove the metadata row so it disappears from the user's vault.
    }
  }

  await prisma.managedAgentSession.delete({ where: { id } })
  return NextResponse.json({ ok: true, deleted: id })
}
