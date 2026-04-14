import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const community = await prisma.community.findUnique({
      where: { slug },
    });
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }
    return NextResponse.json({ community });
  } catch (error) {
    console.error('Community detail error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
