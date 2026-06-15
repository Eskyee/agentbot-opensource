import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  // Require admin authentication
  const session = await getAuthSession();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      deployments: agents,
      total: agents.length,
      status: 'ok',
    })
  } catch (error) {
    console.error('Failed to fetch deployments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deployments', deployments: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const forwardUrl = new URL('/api/provision', request.url);

    const response = await fetch(forwardUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({
      success: false,
      error: 'Provisioning returned an invalid response',
    }));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to create deployment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create deployment' },
      { status: 500 }
    );
  }
}


