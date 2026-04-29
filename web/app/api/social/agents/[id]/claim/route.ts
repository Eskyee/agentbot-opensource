import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { ensureLocalUser, generateChallengeCode } from '@/lib/social/identity';
import crypto from 'crypto';


export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const localUser = await ensureLocalUser(session.user.id);

    const agent = await prisma.socialAgent.findUnique({ where: { id } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check for existing claim
    const existingClaim = await prisma.agentClaim.findUnique({
      where: { agentId_userId: { agentId: id, userId: localUser.id } },
    });
    if (existingClaim) {
      return NextResponse.json({
        claim: existingClaim,
        challengeText: `Verifying my Agentbot agent ownership: ${existingClaim.xChallengeCode} #agentbot`,
      });
    }

    const challengeCode = generateChallengeCode();
    const claimToken = crypto.randomUUID();

    const claim = await prisma.agentClaim.create({
      data: {
        agentId: id,
        userId: localUser.id,
        status: 'x_pending',
        claimToken,
        xChallengeCode: challengeCode,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return NextResponse.json({
      claim,
      challengeText: `Verifying my Agentbot agent ownership: ${challengeCode} #agentbot`,
    }, { status: 201 });
  } catch (error) {
    console.error('Agent claim error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
