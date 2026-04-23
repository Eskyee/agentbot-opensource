import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { deleteXAccount } from '@/app/lib/xApi'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await deleteXAccount(session.user.id)
  return NextResponse.json({ ok: true })
}
