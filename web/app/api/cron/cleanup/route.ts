import { NextResponse } from 'next/server'

/**
 * CRON cleanup endpoint for scheduled maintenance tasks
 * 
 * Currently disabled: verificationToken model not in schema
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Cleanup skipped: verificationToken model not available',
    results: []
  })
}
