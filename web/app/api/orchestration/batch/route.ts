/**
 * POST /api/orchestration/batch
 *
 * Execute multiple tool calls with concurrent optimization.
 * Read-only tools run in parallel, mutating tools serialize.
 *
 * Body: { tools: ToolCall[] }
 * Response: { result: ExecutionResult }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getBackendApiUrl, getInternalApiKey } from '@/app/api/lib/api-keys'

interface BatchRequestBody {
  tools: Array<{
    id: string
    toolName: string
    input: Record<string, unknown>
  }>
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: BatchRequestBody = await req.json()

    if (!body.tools || !Array.isArray(body.tools) || body.tools.length === 0) {
      return NextResponse.json({ error: 'tools array required' }, { status: 400 })
    }

    if (body.tools.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 tools per batch' }, { status: 400 })
    }

    // Validate each tool has id and toolName
    for (const tool of body.tools) {
      if (!tool.id || !tool.toolName) {
        return NextResponse.json(
          { error: 'Each tool must have id and toolName' },
          { status: 400 }
        )
      }
    }

    // Forward to backend orchestration service
    const backendUrl = getBackendApiUrl()
    const response = await fetch(`${backendUrl}/api/orchestration/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getInternalApiKey()}`,
      },
      body: JSON.stringify({
        tools: body.tools,
        userId: session.user.id,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: 'Orchestration failed', detail: error },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Orchestration API]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
