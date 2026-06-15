import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { getBankrApiKey } from '@/app/api/user/bankr-key/route';

const BANKR_API_URL = process.env.BANKR_API_URL || 'https://api.bankr.bot';

async function resolveKey(userId: string): Promise<string | null> {
  return (await getBankrApiKey(userId)) || process.env.BANKR_API_KEY || null;
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

  try {
    const res = await fetch(`${BANKR_API_URL}/agent/profile`, {
      headers: { 'X-API-Key': apiKey },
    });

    if (res.status === 404) {
      return NextResponse.json({ profile: null });
    }

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
    const { projectName, tokenAddress, description, twitter } = body;

    if (!projectName || !tokenAddress) {
      return NextResponse.json({ error: 'projectName and tokenAddress required' }, { status: 400 });
    }

    const res = await fetch(`${BANKR_API_URL}/agent/profile`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectName, tokenAddress, description, twitter }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const res = await fetch(`${BANKR_API_URL}/agent/profile`, {
      method: 'PUT',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = await resolveKey(session.user.id);
  if (!apiKey) {
    return NextResponse.json({ error: 'No Bankr API key configured', needsKey: true }, { status: 503 });
  }

  try {
    const res = await fetch(`${BANKR_API_URL}/agent/profile`, {
      method: 'DELETE',
      headers: { 'X-API-Key': apiKey },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
