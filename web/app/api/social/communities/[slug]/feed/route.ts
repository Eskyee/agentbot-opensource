import { NextRequest, NextResponse } from 'next/server';
import { getCommunityFeed } from '@/lib/social/feed';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const sort = (searchParams.get('sort') ?? 'latest') as 'latest' | 'top_24h' | 'top_7d';
    const cursor = searchParams.get('cursor') ?? undefined;

    const posts = await getCommunityFeed(slug, sort, cursor);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Community feed error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
