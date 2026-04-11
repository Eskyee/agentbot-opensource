import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { buildManagedVaultContextForUser } from '@/app/lib/vault'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vault = await buildManagedVaultContextForUser(session.user.id)
    return NextResponse.json(vault)
  } catch (error) {
    console.error('Managed vault GET error:', error)
    return NextResponse.json({ error: 'Failed to load managed vault' }, { status: 500 })
  }
}
