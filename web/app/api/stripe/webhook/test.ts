import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok', message: 'Webhook endpoint is responding' });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  
  // Just echo back for testing
  return NextResponse.json({
    received: true,
    bodyLength: body.length,
    timestamp: new Date().toISOString()
  });
}
