import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';

// GET /api/user-connections — list all connections for the current user
export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connections = await prisma.userConnection.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      provider: true,
      status: 'connected',
      scope: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ connections });
}

// POST /api/user-connections — create or update a connection
export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { provider, accessToken, refreshToken, expiresAt, scope, metadata } = body;

  if (!provider || !accessToken) {
    return NextResponse.json({ error: 'provider and accessToken required' }, { status: 400 });
  }

  const connection = await prisma.userConnection.upsert({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider,
      },
    },
    update: {
      accessToken,
      refreshToken: refreshToken || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      scope: scope || null,
      metadata: metadata || {},
    },
    create: {
      userId: session.user.id,
      provider,
      accessToken,
      refreshToken: refreshToken || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      scope: scope || null,
      metadata: metadata || {},
    },
    select: {
      id: true,
      provider: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ connection });
}

// DELETE /api/user-connections — remove a connection
export async function DELETE(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');

  if (!provider) {
    return NextResponse.json({ error: 'provider query param required' }, { status: 400 });
  }

  await prisma.userConnection.deleteMany({
    where: {
      userId: session.user.id,
      provider,
    },
  });

  return NextResponse.json({ success: true });
}
