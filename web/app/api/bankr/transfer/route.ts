import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getBankrApiKey } from '@/app/api/user/bankr-key/route'

const BANKR_API_URL = process.env.BANKR_API_URL || 'https://api.bankr.bot'

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = (await getBankrApiKey(session.user.id)) || process.env.BANKR_API_KEY || null
  if (!apiKey) {
    return NextResponse.json({ error: 'No Bankr API key configured', needsKey: true }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { tokenAddress, recipientAddress, amount, isNativeToken } = body as {
    tokenAddress?: string
    recipientAddress?: string
    amount?: string
    isNativeToken?: boolean
  }

  if (!tokenAddress || !recipientAddress || !amount || isNativeToken === undefined) {
    return NextResponse.json(
      { error: 'tokenAddress, recipientAddress, amount, and isNativeToken are required' },
      { status: 400 },
    )
  }

  try {
    const res = await fetch(`${BANKR_API_URL}/wallet/transfer`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenAddress, recipientAddress, amount, isNativeToken }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
