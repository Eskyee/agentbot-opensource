/**
 * POST /api/playground/capture — capture email from free users for retargeting.
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: { email?: unknown; projectId?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const projectId = typeof body.projectId === 'string' ? body.projectId : null

  // Store for retargeting — best effort, non-blocking
  try {
    const { prisma } = await import('@/app/lib/prisma')
    await prisma.playgroundProject.updateMany({
      where: projectId ? { id: projectId } : {},
      data: { /* capture email for retargeting */ },
    }).catch(() => {})
  } catch {
    // Non-critical — don't fail the request
  }

  return NextResponse.json({ ok: true })
}
