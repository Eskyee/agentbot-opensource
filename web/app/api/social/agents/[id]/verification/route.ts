import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const claims = await prisma.agentClaim.findMany({
      where: { agentId: id },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (claims.length === 0) {
      return NextResponse.json({ claim: null });
    }

    const claim = claims[0];
    const challengeText = claim.xChallengeCode
      ? `Verifying my Agentbot agent ownership: ${claim.xChallengeCode} #agentbot`
      : null;
    return NextResponse.json({ claim, challengeText });
  } catch (error) {
    console.error('Verification status error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
