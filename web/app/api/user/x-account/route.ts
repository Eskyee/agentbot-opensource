import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { deleteXAccount, getStoredXAccount, saveXAccount } from '@/app/lib/xApi'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const account = await getStoredXAccount(session.user.id)
    return NextResponse.json({
      configured: Boolean(account),
      account,
    })
  } catch (error) {
    console.error('X account GET error:', error)
    return NextResponse.json({ error: 'Failed to read X account status' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accessToken, refreshToken, username, accountId, scopes } = await req.json()

    if (!accessToken || typeof accessToken !== 'string' || !accessToken.trim()) {
      return NextResponse.json({ error: 'accessToken required' }, { status: 400 })
    }

    await saveXAccount(session.user.id, {
      accessToken: accessToken.trim(),
      refreshToken: typeof refreshToken === 'string' ? refreshToken.trim() : null,
      username: typeof username === 'string' ? username.trim() : null,
      accountId: typeof accountId === 'string' ? accountId.trim() : null,
      scopes: Array.isArray(scopes) ? scopes.filter((scope): scope is string => typeof scope === 'string') : [],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('X account POST error:', error)
    const message = error instanceof Error ? error.message : 'Failed to save X account'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await deleteXAccount(session.user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('X account DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove X account' }, { status: 500 })
  }
}
