import { NextResponse } from 'next/server'

// Disabled: scheduledTask model not in schema
export async function GET() {
  return NextResponse.json({ error: 'Scheduled tasks not available' }, { status: 503 })
}

export async function POST() {
  return NextResponse.json({ error: 'Scheduled tasks not available' }, { status: 503 })
}
