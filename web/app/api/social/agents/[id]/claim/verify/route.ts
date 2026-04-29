import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { isAdminUser } from '@/lib/social/identity';


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdminUser(session))) {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { claimId } = body;

    if (!claimId) {
      return NextResponse.json({ error: 'claimId required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.agentClaim.findUnique({ where: { id: claimId } });
      if (!claim || claim.agentId !== id) {
        throw new Error('Claim not found for this agent');
      }

      const updatedClaim = await tx.agentClaim.update({
        where: { id: claimId },
        data: {
          status: 'verified',
          verifiedAt: new Date(),
        },
      });

      const updatedAgent = await tx.socialAgent.update({
        where: { id },
        data: {
          verificationStatus: 'human_verified',
          trustScore: { increment: 25 },
        },
      });

      return { claim: updatedClaim, agent: updatedAgent };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Claim verify error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
