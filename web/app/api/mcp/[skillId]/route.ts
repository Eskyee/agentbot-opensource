/**
 * POST /api/mcp/:skillId/activate
 * POST /api/mcp/:skillId/deactivate
 * POST /api/mcp/:skillId/call/:toolName
 *
 * MCP (Model Context Protocol) endpoints for skill-embedded tools.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { mcpManager } from '@/app/lib/mcp'

// POST /api/mcp/:skillId/activate
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { skillId } = await params
    const mcp = await mcpManager.activate(skillId)

    return NextResponse.json({
      success: true,
      skillId,
      mcp: {
        name: mcp.config.name,
        version: mcp.config.version,
        tools: mcp.config.tools.map(t => t.name),
        startedAt: mcp.startedAt
      }
    })
  } catch (error) {
    console.error('[MCP Activate] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to activate MCP' },
      { status: 500 }
    )
  }
}

// DELETE /api/mcp/:skillId/deactivate
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { skillId } = await params
    await mcpManager.deactivate(skillId)

    return NextResponse.json({
      success: true,
      skillId,
      message: 'MCP deactivated'
    })
  } catch (error) {
    console.error('[MCP Deactivate] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deactivate MCP' },
      { status: 500 }
    )
  }
}
