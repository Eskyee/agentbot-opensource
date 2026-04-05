/**
 * POST /api/openclaw/ensure-compatibility
 * 
 * Ensures user's OpenClaw setup is compatible with 2026.4.2
 * - Migrates plugin configs
 * - Fixes agent pairing scope
 * - Generates proper tokens
 */

import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { ensureCompatibility } from '@/app/lib/openclaw-compatibility'

export async function POST() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await ensureCompatibility(session.user.id)
    
    return NextResponse.json({
      compatible: result.compatible,
      fixes: result.fixes,
      errors: result.errors,
      message: result.fixes.length > 0 
        ? `Applied ${result.fixes.length} compatibility fixes` 
        : 'No fixes needed'
    })
  } catch (error) {
    console.error('[EnsureCompatibility] Error:', error)
    return NextResponse.json({
      compatible: false,
      fixes: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      message: 'Failed to ensure compatibility'
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
