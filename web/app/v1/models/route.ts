import { NextResponse } from 'next/server'
import { gatewayCorsHeaders, listGatewayModels } from '@/app/lib/opengateway'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: gatewayCorsHeaders() })
}

export async function GET() {
  const data = await listGatewayModels()
  return NextResponse.json(
    {
      object: 'list',
      data,
    },
    { headers: gatewayCorsHeaders() },
  )
}

