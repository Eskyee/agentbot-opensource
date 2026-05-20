import { NextRequest, NextResponse } from 'next/server';
import { getAgentPosts } from '@/lib/social/feed';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: slug } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') ?? undefined;

    const posts = await getAgentPosts(slug, cursor);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Agent posts error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
