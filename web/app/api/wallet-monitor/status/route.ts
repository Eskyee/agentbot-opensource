import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { fetchWalletStatuses, getWalletAlertCommand } from '@/app/lib/node-wallet-monitor'
import { sendSupportAlert } from '@/app/lib/support-alert'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const statuses = await fetchWalletStatuses()
  const low = statuses.filter((status) => !status.healthy)

  if (low.length > 0) {
    const message = `Detected ${low.length} node wallet(s) below ${low[0].threshold} pathUSD`
    sendSupportAlert({
      title: 'Node wallet low balance',
      message,
      metadata: { user: session.user.email, low_wallets: low.map((w) => w.address) },
    }).catch(() => {})
  }

  return NextResponse.json({
    statuses: statuses.map((status) => ({
      ...status,
      alertCommand: getWalletAlertCommand(status.address),
    })),
    lowCount: low.length,
    timestamp: new Date().toISOString(),
  })
}
