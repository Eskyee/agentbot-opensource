import { NextResponse } from 'next/server'
import { paidTools } from '@/app/lib/paidTools'


export async function GET() {
  return NextResponse.json({
    tools: paidTools,
  })
}
