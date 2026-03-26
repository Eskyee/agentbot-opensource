/**
 * MPP Sessions API
 * 
 * GET    /api/wallet/sessions?address=0x...          → List user sessions
 * POST   /api/wallet/sessions                         → Create session (open)
 * DELETE /api/wallet/sessions?sessionId=ses_...       → Close session
 * 
 * POST   /api/wallet/sessions/voucher                 → Submit voucher (off-chain debit)
 */

import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { authOptions } from '@/app/lib/auth'
import type { Address } from 'viem'
import {
  createSession,
  getSession,
  getUserSession,
  listUserSessions,
  processVoucher,
  closeSession,
} from '@/lib/mpp/sessions'

/**
 * GET — List sessions or get specific session
 */
export async function GET(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address') as Address | null
  const sessionId = searchParams.get('sessionId')

  if (sessionId) {
    const sess = getSession(sessionId)
    if (!sess) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    return NextResponse.json({ session: sess })
  }

  if (!address) {
    return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 })
  }

  const sessions = listUserSessions(address)
  return NextResponse.json({ sessions })
}

/**
 * POST — Create new session
 */
export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { address, deposit } = body as { address: Address; deposit: string }

    if (!address || !deposit) {
      return NextResponse.json(
        { error: 'Missing address or deposit' },
        { status: 400 }
      )
    }

    // Check for existing active session
    const existing = getUserSession(address)
    if (existing) {
      return NextResponse.json({
        session: existing,
        note: 'Active session already exists',
      })
    }

    const newSession = createSession(address, deposit)
    return NextResponse.json({ session: newSession }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 400 }
    )
  }
}

/**
 * DELETE — Close session
 */
export async function DELETE(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  const result = await closeSession(sessionId)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, returned: result.returned })
}


export const dynamic = 'force-dynamic';
