/**
 * POST /api/init-deep
 *
 * Generate hierarchical AGENTS.md files throughout the project.
 * Body: { path?: string, force?: boolean, dryRun?: boolean }
 * Response: { results: GenerationResult[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { initDeep, InitDeepOptions } from '@/app/lib/init-deep'

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))

    const options: InitDeepOptions = {
      rootPath: body.path || process.cwd(),
      force: body.force === true,
      dryRun: body.dryRun === true,
      maxDepth: body.maxDepth || 5,
    }

    console.log('[init-deep] Starting generation:', options)

    const results = await initDeep(options)

    const generated = results.filter((r) => r.generated).length
    const skipped = results.filter((r) => r.skipped).length
    const errors = results.filter((r) => r.error).length

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        generated,
        skipped,
        errors,
      },
      results,
    })
  } catch (error) {
    console.error('[init-deep] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate AGENTS.md files',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/init-deep/status
 *
 * Check which directories have AGENTS.md files
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const targetPath = searchParams.get('path') || process.cwd()

    const fs = await import('fs')
    const path = await import('path')

    // List priority directories and check for AGENTS.md
    const priorityDirs = [
      'web/app/api',
      'web/app/lib',
      'web/components',
      'agentbot-backend/src',
      'skills',
    ]

    const status = priorityDirs.map((dir) => {
      const fullPath = path.join(targetPath, dir)
      const hasAgentsMd = fs.existsSync(path.join(fullPath, 'AGENTS.md'))
      return {
        directory: dir,
        hasAgentsMd,
        path: fullPath,
      }
    })

    return NextResponse.json({
      rootPath: targetPath,
      status,
      allGenerated: status.every((s) => s.hasAgentsMd),
    })
  } catch (error) {
    console.error('[init-deep] Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
