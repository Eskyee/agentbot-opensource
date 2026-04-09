import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { mcpManager } from '@/app/lib/mcp'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function parseParameters(req: NextRequest): Promise<Record<string, unknown>> {
  const rawBody = await req.text()
  if (!rawBody) {
    return {}
  }

  const body = JSON.parse(rawBody) as unknown

  if (isRecord(body) && isRecord(body.parameters)) {
    return body.parameters
  }

  if (isRecord(body)) {
    return body
  }

  throw new Error('Request body must be a JSON object')
}

// POST /api/mcp/:skillId/call/:toolName
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ skillId: string; toolName: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ skillId, toolName }, parameters] = await Promise.all([
      params,
      parseParameters(req)
    ])

    const result = await mcpManager.callTool(skillId, toolName, parameters)
    const status = result.success ? 200 : 400

    return NextResponse.json(
      {
        skillId,
        toolName,
        ...result
      },
      { status }
    )
  } catch (error) {
    console.error('[MCP Call] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to call MCP tool' },
      { status: 500 }
    )
  }
}
