/**
 * verifyApiKey — Bearer token auth for programmatic/agent access.
 *
 * API keys are issued via /settings and stored as SHA-256 hashes.
 * Format: "ab_<random>" where the prefix is stored for display.
 *
 * Usage:
 *   const keyAuth = await verifyApiKey(request)
 *   if (!keyAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 */

import crypto from 'crypto'
import { prisma } from '@/app/lib/prisma'

export interface ApiKeyAuth {
  userId: string
  apiKeyId: string
}

export async function verifyApiKey(req: Request): Promise<ApiKeyAuth | null> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawKey = authHeader.slice(7).trim()
  if (!rawKey) return null

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      select: { id: true, userId: true },
    })

    if (!apiKey) return null

    // Touch lastUsed without blocking the response
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() },
    }).catch(() => {})

    return { userId: apiKey.userId, apiKeyId: apiKey.id }
  } catch {
    return null
  }
}
