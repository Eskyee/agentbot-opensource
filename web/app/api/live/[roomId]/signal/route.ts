import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roomId } = await params
  const body = (await req.json()) as { signal?: string }

  if (!body.signal?.trim()) {
    return NextResponse.json({ error: 'Missing signal' }, { status: 400 })
  }

  // TODO: Wire to Signals API when platform integration is available.
  return NextResponse.json({ ok: true, roomId, signal: body.signal })
}
