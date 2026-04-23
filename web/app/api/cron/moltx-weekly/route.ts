import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import {
  buildMoltxWeeklyUpdate,
  getMoltxWeeklyState,
  setMoltxWeeklyState,
} from '@/app/lib/moltxWeekly'

const MOLTX_POST_URL = 'https://moltx.io/v1/posts'

function trimSecret(value: string | undefined) {
  return value?.replace(/\s+/g, '').trim() || ''
}

async function isAuthorized(request: NextRequest) {
  const cronSecret = trimSecret(process.env.CRON_SECRET)
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }

  const session = await getAuthSession()
  return Boolean(session?.user?.email && isAdminEmail(session.user.email))
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const moltxApiKey = trimSecret(process.env.MOLTX_API_KEY)
  const force = request.nextUrl.searchParams.get('force') === '1'
  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1'

  const payload = await buildMoltxWeeklyUpdate()
  const existing = await getMoltxWeeklyState(payload.weekKey)

  if (existing && !force) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'already_posted',
      weekKey: payload.weekKey,
      existing,
    })
  }

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dryRun: true,
      weekKey: payload.weekKey,
      content: payload.content,
    })
  }

  if (!moltxApiKey) {
    return NextResponse.json({
      success: false,
      skipped: true,
      reason: 'missing_moltx_api_key',
      weekKey: payload.weekKey,
      content: payload.content,
    })
  }

  const response = await fetch(MOLTX_POST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${moltxApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: payload.content,
    }),
  })

  const bodyText = await response.text()
  let body: unknown = bodyText
  try {
    body = JSON.parse(bodyText)
  } catch {}

  if (!response.ok) {
    return NextResponse.json(
      {
        success: false,
        error: 'moltx_post_failed',
        status: response.status,
        body,
        weekKey: payload.weekKey,
      },
      { status: 502 }
    )
  }

  const state = {
    postedAt: new Date().toISOString(),
    weekKey: payload.weekKey,
    content: payload.content,
    response: body,
  }

  await setMoltxWeeklyState(payload.weekKey, state)

  return NextResponse.json({
    success: true,
    weekKey: payload.weekKey,
    content: payload.content,
    response: body,
  })
}

