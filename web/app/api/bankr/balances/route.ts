import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getBankrApiKey } from '@/app/api/user/bankr-key/route'

export const dynamic = 'force-dynamic';

const BANKR_API_URL = process.env.BANKR_API_URL || 'https://api.bankr.bot';

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User's own key takes precedence; fall back to platform key
  const apiKey = (await getBankrApiKey(session.user.id)) || process.env.BANKR_API_KEY || null;

  if (!apiKey) {
    return NextResponse.json({ error: 'No Bankr API key configured', needsKey: true }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const chains = searchParams.get('chains') || 'base,polygon,mainnet,solana,unichain';

  try {
    const res = await fetch(`${BANKR_API_URL}/agent/balances?chains=${chains}`, {
      headers: { 'X-API-Key': apiKey },
    });

    if (!res.ok) {
      throw new Error(`Bankr API error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
