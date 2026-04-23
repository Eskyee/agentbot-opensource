import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAuthSession } from '@/app/lib/getAuthSession';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        websocketUrl: true,
        config: true,
      },
      take: 20,
    });

    return NextResponse.json({ agents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
