import { NextResponse } from 'next/server'

// Disabled: verificationToken model not in schema
export async function POST() {
  return NextResponse.json({ error: 'Password reset temporarily disabled' }, { status: 503 })
}
