import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getBankrApiKey } from '@/app/api/user/bankr-key/route'

export const dynamic = 'force-dynamic';

const BANKR_API_URL = process.env.BANKR_API_URL || 'https://api.bankr.bot';

async function resolveKey(userId: string): Promise<string | null> {
  return (await getBankrApiKey(userId)) || process.env.BANKR_API_KEY || null;
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = await resolveKey(session.user.id);
  if (!apiKey) {
    return NextResponse.json({ error: 'No Bankr API key configured', needsKey: true }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { prompt, threadId } = body;

    const res = await fetch(`${BANKR_API_URL}/agent/prompt`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, ...(threadId && { threadId }) }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = await resolveKey(session.user.id);
  if (!apiKey) {
    return NextResponse.json({ error: 'No Bankr API key configured', needsKey: true }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${BANKR_API_URL}/agent/job/${jobId}`, {
      headers: { 'X-API-Key': apiKey },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
