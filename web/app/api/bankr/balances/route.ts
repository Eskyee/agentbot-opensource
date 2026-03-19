import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

const BANKR_API_URL = process.env.BANKR_API_URL || 'https://api.bankr.bot';
const BANKR_API_KEY = process.env.BANKR_API_KEY;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'raveculture@icloud.com').split(',');

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const chains = searchParams.get('chains') || 'base,polygon,mainnet,solana,unichain';

  if (!BANKR_API_KEY) {
    return NextResponse.json(
      { error: 'Bankr API not configured' },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${BANKR_API_URL}/agent/balances?chains=${chains}`, {
      headers: {
        'X-API-Key': BANKR_API_KEY,
      },
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
