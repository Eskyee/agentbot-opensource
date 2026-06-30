import { NextRequest } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { platform } = body;

  if (!platform) {
    return Response.json({ error: 'Platform required' }, { status: 400 });
  }

  try {
    const connection = await prisma.chatPlatformConnection.findFirst({
      where: {
        userId: session.user.id,
        platform,
        status: 'connected',
      },
    });

    if (!connection) {
      return Response.json({ error: 'Platform not connected' }, { status: 404 });
    }

    const credentials = connection.credentials as Record<string, string>;

    if (platform === 'linear') {
      const apiKey = credentials.LINEAR_API_KEY;
      if (!apiKey) {
        return Response.json({ error: 'No LINEAR_API_KEY stored' }, { status: 400 });
      }

      const res = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiKey,
        },
        body: JSON.stringify({
          query: '{ viewer { id name email } teams { nodes { name } } }',
        }),
      });

      const data = await res.json();

      if (data.errors) {
        return Response.json({
          ok: false,
          error: data.errors[0]?.message || 'Linear API error',
        });
      }

      return Response.json({
        ok: true,
        user: data.data?.viewer,
        teams: data.data?.teams?.nodes || [],
      });
    }

    if (platform === 'github') {
      const token = credentials.GITHUB_TOKEN;
      if (!token) {
        return Response.json({ error: 'No GITHUB_TOKEN stored' }, { status: 400 });
      }

      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        return Response.json({ ok: false, error: 'Invalid GitHub token' });
      }

      const data = await res.json();
      return Response.json({
        ok: true,
        user: { login: data.login, name: data.name },
      });
    }

    if (platform === 'slack') {
      const token = credentials.SLACK_BOT_TOKEN;
      if (!token) {
        return Response.json({ error: 'No SLACK_BOT_TOKEN stored' }, { status: 400 });
      }

      const res = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!data.ok) {
        return Response.json({ ok: false, error: data.error || 'Slack auth failed' });
      }

      return Response.json({
        ok: true,
        user: { team: data.team, user: data.user },
      });
    }

    return Response.json({ error: `Test not implemented for ${platform}` }, { status: 500 });
  } catch (error) {
    console.error('[chat-platforms/test] failed:', error);
    return Response.json({ error: 'Test failed' }, { status: 500 });
  }
}
