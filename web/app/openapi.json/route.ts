import { NextResponse } from 'next/server'
import { paidTools } from '@/app/lib/paidTools'

export const dynamic = 'force-dynamic'

export async function GET() {
  const paths = Object.fromEntries(
    paidTools.map((tool) => [
      `/api/tools/${tool.id}`,
      {
        post: {
          summary: tool.name,
          description: tool.description,
          tags: [tool.category, 'Paid Tools'],
          operationId: tool.id,
          'x-payment-info': {
            protocol: 'mpp+x402',
            priceRange: tool.priceRange,
            priceMode: 'dynamic-quote',
            acceptedNetworks: tool.networks,
          },
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    input: { type: 'object' },
                    options: { type: 'object' },
                    preview: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Paid tool result' },
            '402': { description: 'Payment required with exact quote' },
          },
        },
      },
    ])
  )

  return NextResponse.json({
    openapi: '3.1.0',
    info: {
      title: 'Agentbot Paid Tools API',
      version: '0.2.0',
      description: 'Agentbot-native paid tools catalog with dynamic quotes, receipts, and machine-readable discovery metadata.',
    },
    paths,
  })
}
