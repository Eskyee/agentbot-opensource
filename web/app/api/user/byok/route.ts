/**
 * BYOK (Bring Your Own Key) — User MiMo API Key Registration
 *
 * POST   /api/user/byok  — Register user's own MiMo API key
 * DELETE /api/user/byok  — Remove user's key (revert to platform key)
 * GET    /api/user/byok  — Check BYOK status
 *
 * Uses existing UserSetting table (key/value) for storage — no migration needed.
 * Keys stored as base64 (not encrypted — production should use AES-256-GCM).
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

const MIMO_BASE_URL = process.env.MIMO_BASE_URL || 'https://token-plan-ams.xiaomimimo.com/v1'
const BYOK_KEY = 'byok_mimo_key'
const BYOK_ENABLED = 'byok_mimo_enabled'

function extractBearer(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') || ''
  const match = auth.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

async function authenticate(req: NextRequest) {
  const rawKey = extractBearer(req)
  if (!rawKey) return null
  const prefix = rawKey.slice(0, 18)
  const candidate = await prisma.apiKey.findFirst({
    where: { keyPrefix: prefix },
    select: { id: true, userId: true, keyHash: true },
  })
  if (!candidate) return null
  const valid = await bcrypt.compare(rawKey, candidate.keyHash)
  return valid ? candidate : null
}

async function getUserSetting(userId: string, key: string) {
  const setting = await (prisma as any).userSetting.findFirst({
    where: { userId, key },
  })
  return setting?.value || null
}

async function setUserSetting(userId: string, key: string, value: string) {
  const existing = await (prisma as any).userSetting.findFirst({
    where: { userId, key },
  })
  if (existing) {
    await (prisma as any).userSetting.update({
      where: { id: existing.id },
      data: { value, updatedAt: new Date() },
    })
  } else {
    await (prisma as any).userSetting.create({
      data: { userId, key, value },
    })
  }
}

async function deleteUserSetting(userId: string, key: string) {
  await (prisma as any).userSetting.deleteMany({
    where: { userId, key },
  })
}

export async function GET(req: NextRequest) {
  const auth = await authenticate(req)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const enabled = await getUserSetting(auth.userId, BYOK_ENABLED)
  const hasKey = await getUserSetting(auth.userId, BYOK_KEY)

  return NextResponse.json({
    byokEnabled: enabled === 'true',
    hasKey: !!hasKey,
    provider: 'xiaomi',
  })
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { apiKey?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const apiKey = body.apiKey?.trim()
  if (!apiKey) {
    return NextResponse.json({ error: 'apiKey is required' }, { status: 400 })
  }

  // Validate the key by hitting MiMo API
  try {
    const testResponse = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'mimo-v2.5',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 3,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!testResponse.ok) {
      const errText = await testResponse.text().catch(() => '')
      return NextResponse.json(
        { error: `MiMo API validation failed (${testResponse.status}): ${errText.slice(0, 200)}` },
        { status: 400 }
      )
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to reach MiMo API: ${e instanceof Error ? e.message : 'unknown'}` },
      { status: 400 }
    )
  }

  // Store key as base64 (production: use AES-256-GCM)
  const encrypted = Buffer.from(apiKey).toString('base64')
  await setUserSetting(auth.userId, BYOK_KEY, encrypted)
  await setUserSetting(auth.userId, BYOK_ENABLED, 'true')

  return NextResponse.json({
    success: true,
    message: 'MiMo API key registered. Your requests will use your own subscription.',
  })
}

export async function DELETE(req: NextRequest) {
  const auth = await authenticate(req)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await deleteUserSetting(auth.userId, BYOK_KEY)
  await deleteUserSetting(auth.userId, BYOK_ENABLED)

  return NextResponse.json({
    success: true,
    message: 'BYOK disabled. Reverted to platform-managed keys.',
  })
}
