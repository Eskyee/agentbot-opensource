import { NextRequest } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';

let prisma: any = null;
async function getPrisma() {
  if (!prisma) {
    const mod = await import('@/app/lib/prisma');
    prisma = mod.prisma;
  }
  return prisma;
}

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await getPrisma();
    const servers = await db.mcpServer.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ servers });
  } catch (error: any) {
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return Response.json({ servers: [] });
    }
    console.error('[mcp] list failed:', error);
    return Response.json({ error: 'Failed to load MCP servers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, type, config } = body;

  if (!name || !type) {
    return Response.json({ error: 'Name and type required' }, { status: 400 });
  }

  try {
    const db = await getPrisma();
    const server = await db.mcpServer.create({
      data: {
        userId: session.user.id,
        name,
        type,
        config: config || {},
      },
    });

    return Response.json({ server });
  } catch (error) {
    console.error('[mcp] create failed:', error);
    return Response.json({ error: 'Failed to create MCP server' }, { status: 500 });
  }
}
