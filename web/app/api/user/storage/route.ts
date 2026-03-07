import { NextResponse } from 'next/server'

// Disabled: storageLimit field not in User model
export async function GET() {
  return NextResponse.json({ error: 'Storage API not available' }, { status: 503 })
}
