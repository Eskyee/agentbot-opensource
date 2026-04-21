import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { deleteGitHubBot, getStoredGitHubBot, saveGitHubBot } from '@/app/lib/githubBot'

export const dynamic = 'force-dynamic'

function normalizeRepoAllowlist(value: unknown) {
  if (typeof value !== 'string') return []
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 100)
}

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const account = await getStoredGitHubBot(session.user.id)
    return NextResponse.json({
      configured: Boolean(account),
      account,
    })
  } catch (error) {
    console.error('GitHub bot GET error:', error)
    return NextResponse.json({ error: 'Failed to read GitHub bot status' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token, username, email, repoAllowlist } = await req.json()

    if (!token || typeof token !== 'string' || !token.trim()) {
      return NextResponse.json({ error: 'token required' }, { status: 400 })
    }
    if (!username || typeof username !== 'string' || !username.trim()) {
      return NextResponse.json({ error: 'username required' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }

    await saveGitHubBot(session.user.id, {
      token: token.trim(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      repoAllowlist: normalizeRepoAllowlist(repoAllowlist),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('GitHub bot POST error:', error)
    const message = error instanceof Error ? error.message : 'Failed to save GitHub bot account'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await deleteGitHubBot(session.user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('GitHub bot DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove GitHub bot account' }, { status: 500 })
  }
}
