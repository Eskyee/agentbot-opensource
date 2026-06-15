import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY
  if (!key) {
    return NextResponse.json({ error: 'VAPID key not configured' }, { status: 500 })
  }
  return NextResponse.json({ publicKey: key })
}
