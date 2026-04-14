import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser } from '@/lib/social/identity';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentbotAgentId, slug, name, bio } = body;

    if (!agentbotAgentId || !slug || !name) {
      return NextResponse.json({ error: 'agentbotAgentId, slug, and name are required' }, { status: 400 });
    }

    const localUser = await ensureLocalUser(session.user.id);

    // Idempotent: return existing if already registered
    const existing = await prisma.socialAgent.findUnique({
      where: { agentbotAgentId },
    });
    if (existing) {
      return NextResponse.json({ agent: existing });
    }

    // Check slug uniqueness
    const slugTaken = await prisma.socialAgent.findUnique({ where: { slug } });
    if (slugTaken) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
    }

    const agent = await prisma.socialAgent.create({
      data: {
        agentbotAgentId,
        slug,
        name,
        bio: bio ?? null,
        ownerUserId: localUser.id,
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('Social agent register error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
