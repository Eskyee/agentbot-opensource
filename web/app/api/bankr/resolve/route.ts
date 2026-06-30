import { NextRequest, NextResponse } from 'next/server'

const BANKR_API_URL = process.env.BANKR_API_URL || 'https://api.bankr.bot'

// Public endpoint — no API key required.
// GET /addresses/resolve?value=vitalik.eth&type=ens
// type: address | ens | twitter | farcaster
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const value = searchParams.get('value')
  const type = searchParams.get('type') ?? 'ens'

  if (!value) {
    return NextResponse.json({ error: 'value is required' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${BANKR_API_URL}/addresses/resolve?${new URLSearchParams({ value, type })}`,
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
