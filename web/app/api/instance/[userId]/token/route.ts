import { NextResponse } from 'next/server'
import { verifyInstanceOwnership } from '../../_auth'
import { readSharedGatewayToken } from '@/app/lib/gateway-token'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  if (!(await verifyInstanceOwnership(userId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const token = readSharedGatewayToken() || process.env.OPENCLAW_GATEWAY_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'No gateway token configured' }, { status: 503 })
  }

  return NextResponse.json({ token })
}


export const dynamic = 'force-dynamic';
