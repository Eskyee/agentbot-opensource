import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const OPENCLAW_CONTROLS_ENABLED =
  process.env.ENABLE_OPENCLAW_CONTROLS !== 'false' &&
  process.env.NEXT_PUBLIC_ENABLE_OPENCLAW_CONTROLS !== 'false'

export function controlsDisabledResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'Managed runtime controls are temporarily disabled until the Railway control path is fully verified.',
    },
    { status: 503 }
  )
}

export async function getOwnedOpenClawUser(instanceId: string) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      openclawInstanceId: true,
      openclawUrl: true,
      plan: true,
    },
  })

  if (!user?.openclawInstanceId || user.openclawInstanceId !== instanceId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user }
}
