import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getCommunityProgramForUser } from '@/app/lib/communityProgram'
import { isAdminEmail } from '@/app/lib/admin'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const program = await getCommunityProgramForUser(session.user.id)

  return NextResponse.json({
    ...program,
    admin: isAdminEmail(session.user.email),
  })
}

