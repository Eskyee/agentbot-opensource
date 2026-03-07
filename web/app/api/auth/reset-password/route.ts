import { NextResponse } from 'next/server'

export async function POST() {
  // Disabled: verificationToken model not in schema
  return NextResponse.json({ error: 'Password reset temporarily disabled' }, { status: 503 })
}
