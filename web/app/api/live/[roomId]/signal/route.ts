import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params
  const body = (await req.json()) as { signal?: string }

  if (!body.signal?.trim()) {
    return NextResponse.json({ error: 'Missing signal' }, { status: 400 })
  }

  // TODO: Wire to Signals API when platform integration is available.
  return NextResponse.json({ ok: true, roomId, signal: body.signal })
}
