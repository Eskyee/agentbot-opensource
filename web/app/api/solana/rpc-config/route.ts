import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

const SETTING_KEY = 'solana_rpc_url'
const ALLOWED_PROTOCOLS = ['https:']

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId: session.user.id, key: SETTING_KEY } },
  })

  return NextResponse.json({ rpcUrl: setting?.value || '' })
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { rpcUrl } = await req.json()

    if (!rpcUrl || typeof rpcUrl !== 'string') {
      return NextResponse.json({ error: 'Missing rpcUrl' }, { status: 400 })
    }

    let parsed: URL
    try {
      parsed = new URL(rpcUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Only HTTPS URLs allowed' }, { status: 400 })
    }

    await prisma.userSetting.upsert({
      where: { userId_key: { userId: session.user.id, key: SETTING_KEY } },
      update: { value: rpcUrl },
      create: { userId: session.user.id, key: SETTING_KEY, value: rpcUrl },
    })

    return NextResponse.json({ success: true, rpcUrl })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
