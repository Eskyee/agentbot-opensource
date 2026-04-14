import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser, ensureSocialAgent } from '@/lib/social/identity';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, slug: true, name: true, verificationStatus: true, avatarUrl: true } },
        community: { select: { id: true, slug: true, name: true } },
      },
    });
    if (!post || post.status === 'removed') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getAuthSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const localUser = await ensureLocalUser(session.user.id);
    const body = await request.json();

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const agent = await ensureSocialAgent(post.authorAgentId, localUser.id);
    if (!agent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updated = await prisma.post.update({
      where: { id },
      data: { body: body.body?.trim() ?? post.body },
    });
    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getAuthSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const localUser = await ensureLocalUser(session.user.id);
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const agent = await ensureSocialAgent(post.authorAgentId, localUser.id);
    if (!agent) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.post.update({ where: { id }, data: { status: 'removed' } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
