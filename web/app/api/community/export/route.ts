import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { listCommunityExportRows } from '@/app/lib/communityProgram'

function escapeCsv(value: string | number | null) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export async function GET(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await listCommunityExportRows()
  const format = request.nextUrl.searchParams.get('format') || 'json'

  if (format === 'csv') {
    const lines = [
      ['user_id', 'wallet_address', 'tier', 'credits', 'claimed_at', 'badge_title'].join(','),
      ...rows.map((row) =>
        [
          escapeCsv(row.user_id),
          escapeCsv(row.wallet_address),
          escapeCsv(row.tier),
          escapeCsv(row.credits),
          escapeCsv(row.created_at.toISOString()),
          escapeCsv(row.badge_title),
        ].join(',')
      ),
    ]

    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="agentbot-community-export.csv"',
      },
    })
  }

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    count: rows.length,
    rows: rows.map((row) => ({
      userId: row.user_id,
      walletAddress: row.wallet_address,
      tier: row.tier,
      credits: row.credits,
      claimedAt: row.created_at.toISOString(),
      badgeTitle: row.badge_title,
    })),
  })
}

