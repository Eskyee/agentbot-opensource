import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getStoredXAccount, getXApiAppStatus } from '@/app/lib/xApi'


export async function GET() {
  try {
    const session = await getAuthSession()
    const app = getXApiAppStatus()

    if (!session?.user?.id) {
      return NextResponse.json({
        app,
        user: {
          connected: false,
          account: null,
        },
      })
    }

    const account = await getStoredXAccount(session.user.id)

    return NextResponse.json({
      app,
      user: {
        connected: Boolean(account),
        account,
      },
    })
  } catch (error) {
    console.error('X status GET error:', error)
    return NextResponse.json({ error: 'Failed to read X API status' }, { status: 500 })
  }
}
