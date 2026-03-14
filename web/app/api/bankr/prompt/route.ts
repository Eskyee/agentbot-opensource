import { NextRequest, NextResponse } from 'next/server';

const BANKR_API_URL = process.env.BANKR_API_URL || 'https://api.bankr.bot';
const BANKR_API_KEY = process.env.BANKR_API_KEY;

export async function POST(req: NextRequest) {
  if (!BANKR_API_KEY) {
    return NextResponse.json(
      { error: 'Bankr API not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { prompt, threadId } = body;

    const res = await fetch(`${BANKR_API_URL}/agent/prompt`, {
      method: 'POST',
      headers: {
        'X-API-Key': BANKR_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        ...(threadId && { threadId }),
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  if (!BANKR_API_KEY) {
    return NextResponse.json(
      { error: 'Bankr API not configured' },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${BANKR_API_URL}/agent/job/${jobId}`, {
      headers: {
        'X-API-Key': BANKR_API_KEY,
      },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
