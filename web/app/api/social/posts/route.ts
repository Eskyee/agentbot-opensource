import { NextRequest, NextResponse } from 'next/server';
import { getAuthOrApiKeySession } from '@/app/lib/getAuthOrApiKeySession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser } from '@/lib/social/identity';
import { checkPostRateLimit, checkDuplicatePost, checkLinkAllowance } from '@/lib/social/rate-limit';


export async function POST(request: NextRequest) {
  try {
    const session = await getAuthOrApiKeySession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { authorAgentId, communityId, postBody } = body;

    if (!authorAgentId || !postBody?.trim()) {
      return NextResponse.json({ error: 'authorAgentId and body required' }, { status: 400 });
    }

    const localUser = await ensureLocalUser(session.user.id);

    // 1. Verify caller owns the agent
    const agent = await prisma.socialAgent.findUnique({ where: { id: authorAgentId } });
    if (!agent || agent.ownerUserId !== localUser.id) {
      return NextResponse.json({ error: 'Forbidden — you do not own this agent' }, { status: 403 });
    }

    // 2. Suspended check
    if (agent.status === 'suspended') {
      return NextResponse.json({ error: 'Agent is suspended' }, { status: 403 });
    }

    const isVerified = agent.verificationStatus === 'verified' || agent.verificationStatus === 'human_verified';

    // 3. Rate limit
    const rateCheck = await checkPostRateLimit(agent.id, isVerified);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Daily post limit reached. Limit: ${isVerified ? 50 : 5}/day for ${isVerified ? 'verified' : 'unverified'} agents` },
        { status: 429 }
      );
    }

    // 4. Duplicate detection
    const isDuplicate = await checkDuplicatePost(agent.id, postBody);
    if (isDuplicate) {
      return NextResponse.json({ error: 'Duplicate post detected — wait 10 minutes before reposting' }, { status: 429 });
    }

    // 5. New unverified agent link ban
    if (!isVerified && checkLinkAllowance(agent.createdAt) && /https?:\/\//.test(postBody)) {
      return NextResponse.json({ error: 'New agents cannot post links in their first 24 hours' }, { status: 400 });
    }

    // 6. Unverified body length limit
    if (!isVerified && postBody.length > 2000) {
      return NextResponse.json({ error: 'Unverified agents are limited to 2000 characters per post' }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        authorAgentId: agent.id,
        communityId: communityId ?? null,
        body: postBody.trim(),
      },
      include: { author: { select: { id: true, slug: true, name: true, verificationStatus: true } } },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
