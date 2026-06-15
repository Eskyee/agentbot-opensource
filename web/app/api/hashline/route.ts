/**
 * Hashline API — Content-addressed file editing
 *
 * GET  /api/hashline?path=/path/to/file      — Read file with hashes
 * POST /api/hashline                         — Apply edit by hash
 *
 * Inspired by Oh My OpenAgent's hash-anchored edit tool.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import {
  readWithHashes,
  formatWithHashes,
  applyEdit,
  applyEdits,
  getFileStats,
  cliFormat,
  parseHashReference,
  findSimilarLines,
} from '@/app/lib/hashline'

/**
 * Admin-only gate — hashline is a read-any/write-any-file primitive.
 * It MUST NOT be reachable by ordinary authenticated users.
 */
async function requireAdmin() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return { ok: false as const, status: 401, error: 'Unauthorized' }
  }
  // Authoritative check via env-backed allowlist only. The JWT `isAdmin`
  // claim is set at login and cached for up to 30 days, so relying on it
  // with `||` would keep removed admins privileged until token expiry.
  // Every other admin-gated route in the codebase uses isAdminEmail alone
  // (e.g. /api/admin/summary, /api/wallet-monitor/status).
  if (!isAdminEmail(session.user.email)) {
    return { ok: false as const, status: 403, error: 'Forbidden' }
  }
  return { ok: true as const, session }
}

/**
 * GET /api/hashline?path=/path/to/file.ts
 *
 * Returns file content with hash markers for each line.
 * Format: "12#A3| const x = 5"
 */
export async function GET(req: NextRequest) {
  try {
    const gate = await requireAdmin()
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { searchParams } = new URL(req.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ error: 'path parameter required' }, { status: 400 })
    }

    // Security: ensure path is within project
    const path = await import('path')
    const resolvedPath = path.resolve(filePath)
    const cwd = process.cwd()

    if (!resolvedPath.startsWith(cwd)) {
      return NextResponse.json(
        { error: 'Invalid path: must be within project directory' },
        { status: 403 }
      )
    }

    const format = searchParams.get('format') || 'json'

    if (format === 'cli') {
      const output = cliFormat(resolvedPath)
      return new NextResponse(output, {
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    const lines = readWithHashes(resolvedPath)
    const stats = getFileStats(resolvedPath)

    return NextResponse.json({
      path: filePath,
      stats,
      lines: lines.map((l) => ({
        lineNumber: l.lineNumber,
        hash: l.hash,
        content: l.content,
        isBlank: l.isBlank,
      })),
      formatted: formatWithHashes(lines),
    })
  } catch (error) {
    console.error('[hashline] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to read file' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hashline
 *
 * Apply edits using hash references.
 *
 * Single edit body:
 *   { path: string, hashRef: string, newContent: string, backup?: boolean }
 *
 * Batch edit body:
 *   { path: string, edits: Array<{ hashRef: string, newContent: string }>, backup?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const gate = await requireAdmin()
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const body = await req.json()
    const { path: filePath, backup = true } = body

    if (!filePath) {
      return NextResponse.json({ error: 'path required' }, { status: 400 })
    }

    // Security: ensure path is within project
    const path = await import('path')
    const resolvedPath = path.resolve(filePath)
    const cwd = process.cwd()

    if (!resolvedPath.startsWith(cwd)) {
      return NextResponse.json(
        { error: 'Invalid path: must be within project directory' },
        { status: 403 }
      )
    }

    // Handle batch edits
    if (body.edits && Array.isArray(body.edits)) {
      const results = applyEdits(
        resolvedPath,
        body.edits.map((e: { hashRef: string; newContent: string }) => ({
          hashRef: e.hashRef,
          newContent: e.newContent,
        })),
        { backup }
      )

      const allSuccess = results.every((r) => r.success)

      return NextResponse.json({
        success: allSuccess,
        path: filePath,
        results,
      })
    }

    // Handle single edit
    const { hashRef, newContent } = body

    if (!hashRef || newContent === undefined) {
      return NextResponse.json(
        { error: 'hashRef and newContent required' },
        { status: 400 }
      )
    }

    const result = applyEdit(resolvedPath, hashRef, newContent, { backup })

    if (!result.success) {
      // Try to find similar lines if hash not found
      if (result.error?.includes('not found')) {
        try {
          const lines = readWithHashes(resolvedPath)
          const similar = findSimilarLines(lines, newContent).slice(0, 5)

          return NextResponse.json(
            {
              error: result.error,
              suggestion: 'Similar lines found:',
              similarLines: similar.map((l) => ({
                lineNumber: l.lineNumber,
                hash: l.hash,
                content: l.content.slice(0, 100),
              })),
            },
            { status: 409 }
          )
        } catch {
          // Ignore similarity search errors
        }
      }

      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('not found') ? 409 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      path: filePath,
      edit: result,
    })
  } catch (error) {
    console.error('[hashline] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to apply edit' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/hashline?path=/path/to/file.ts.backup.123456
 *
 * Clean up backup files
 */
export async function DELETE(req: NextRequest) {
  try {
    const gate = await requireAdmin()
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { searchParams } = new URL(req.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ error: 'path parameter required' }, { status: 400 })
    }

    // Only allow deleting .backup. files
    if (!filePath.includes('.backup.')) {
      return NextResponse.json(
        { error: 'Can only delete .backup. files' },
        { status: 403 }
      )
    }

    const fs = await import('fs')
    const path = await import('path')
    const resolvedPath = path.resolve(filePath)
    const cwd = process.cwd()

    if (!resolvedPath.startsWith(cwd)) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 403 }
      )
    }

    fs.unlinkSync(resolvedPath)

    return NextResponse.json({
      success: true,
      message: `Deleted: ${filePath}`,
    })
  } catch (error) {
    console.error('[hashline] DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete file' },
      { status: 500 }
    )
  }
}
