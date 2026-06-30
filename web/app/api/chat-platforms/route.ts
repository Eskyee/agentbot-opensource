import { NextRequest } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { CHAT_PLATFORMS } from '@/app/lib/chat-sdk/config';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's connected platforms from database
    const connections = await prisma.chatPlatformConnection.findMany({
      where: { userId: session.user.id },
    });

    // Merge with available platforms
    const platforms = CHAT_PLATFORMS.map((platform) => {
      const connection = connections.find((c) => c.platform === platform.id);
      return {
        ...platform,
        connected: !!connection,
        connectedAt: connection?.createdAt,
      };
    });

    return Response.json({ platforms });
  } catch (error) {
    console.error('[chat-platforms] list failed:', error);
    // Return platforms without connection status if table doesn't exist
    return Response.json({
      platforms: CHAT_PLATFORMS.map((p) => ({ ...p, connected: false })),
    });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { platform, credentials } = body;

  if (!platform || !credentials) {
    return Response.json({ error: 'Platform and credentials required' }, { status: 400 });
  }

  try {
    // Store connection in database
    const connection = await prisma.chatPlatformConnection.upsert({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform,
        },
      },
      update: {
        credentials,
        status: 'connected',
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        platform,
        credentials,
        status: 'connected',
      },
    });

    return Response.json({ ok: true, connection });
  } catch (error) {
    console.error('[chat-platforms] connect failed:', error);
    return Response.json({ error: 'Failed to connect platform' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { platform } = body;

  if (!platform) {
    return Response.json({ error: 'Platform required' }, { status: 400 });
  }

  try {
    await prisma.chatPlatformConnection.deleteMany({
      where: {
        userId: session.user.id,
        platform,
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[chat-platforms] disconnect failed:', error);
    return Response.json({ error: 'Failed to disconnect platform' }, { status: 500 });
  }
}
