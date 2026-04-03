import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'
import { encryptToken, decryptToken } from '@/app/lib/token-encryption'

export const dynamic = 'force-dynamic'

const SETTING_KEY = 'bankr_api_key'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const setting = await prisma.userSetting.findUnique({
      where: { userId_key: { userId: session.user.id, key: SETTING_KEY } },
    })

    return NextResponse.json({ configured: !!setting })
  } catch (error) {
    console.error('Bankr key GET error:', error)
    return NextResponse.json({ error: 'Failed to read Bankr key status' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { apiKey } = await req.json()
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return NextResponse.json({ error: 'apiKey required' }, { status: 400 })
    }

    const trimmed = apiKey.trim()
    if (trimmed.length > 512) {
      return NextResponse.json({ error: 'Key too long' }, { status: 400 })
    }

    const encrypted = encryptToken(trimmed)

    await prisma.userSetting.upsert({
      where: { userId_key: { userId: session.user.id, key: SETTING_KEY } },
      update: { value: encrypted },
      create: { userId: session.user.id, key: SETTING_KEY, value: encrypted },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bankr key POST error:', error)
    const message = error instanceof Error ? error.message : 'Failed to save Bankr key'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.userSetting.deleteMany({
      where: { userId: session.user.id, key: SETTING_KEY },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bankr key DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove Bankr key' }, { status: 500 })
  }
}

/** Internal helper — import this from bankr routes */
export async function getBankrApiKey(userId: string): Promise<string | null> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: SETTING_KEY } },
  })
  if (!setting) return null
  try {
    return decryptToken(setting.value)
  } catch {
    return null
  }
}
