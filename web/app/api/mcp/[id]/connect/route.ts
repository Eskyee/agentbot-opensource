import { NextRequest } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';

const OAUTH_CONFIGS: Record<string, { authUrl: string; scopes: string[]; tokenUrl: string }> = {
  slack: {
    authUrl: 'https://slack.com/oauth/v2/authorize',
    scopes: [
      'channels:read',
      'channels:history',
      'chat:write',
      'reactions:read',
      'reactions:write',
    ],
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    scopes: ['repo', 'read:org', 'workflow'],
    tokenUrl: 'https://github.com/login/oauth/access_token',
  },
  linear: {
    authUrl: 'https://linear.app/oauth/authorize',
    scopes: ['issues:create', 'issues:read', 'teams:read'],
    tokenUrl: 'https://api.linear.app/oauth/token',
  },
  sentry: {
    authUrl: 'https://sentry.io/oauth/authorize',
    scopes: ['event:read', 'project:read', 'organization:read'],
    tokenUrl: 'https://sentry.io/api/0/oauth/token',
  },
  datadog: {
    authUrl: 'https://app.datadoghq.com/oauth/authorize',
    scopes: ['api_keys:read', 'logs_read', 'metrics_read'],
    tokenUrl: 'https://api.datadoghq.com/oauth/v1/token',
  },
  notion: {
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    scopes: ['read_content', 'insert_content'],
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
  },
  jira: {
    authUrl: 'https://auth.atlassian.com/authorize',
    scopes: ['read:jira-work', 'write:jira-work'],
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
  },
  figma: {
    authUrl: 'https://www.figma.com/oauth',
    scopes: ['file_read'],
    tokenUrl: 'https://www.figma.com/api/oauth/token',
  },
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { credentials } = body;

  try {
    const server = await prisma.mcpServer.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!server) return Response.json({ error: 'Not found' }, { status: 404 });

    const config = OAUTH_CONFIGS[server.type];
    if (!config) {
      return Response.json({ error: `OAuth not supported for ${server.type}` }, { status: 400 });
    }

    // Store credentials (encrypted in production)
    const encryptedConfig = {
      ...(server.config as object),
      credentials: credentials || null,
      connectedAt: new Date().toISOString(),
    };

    await prisma.mcpServer.update({
      where: { id },
      data: {
        config: encryptedConfig,
        status: 'connected',
        lastCheckedAt: new Date(),
      },
    });

    // Generate OAuth URL for the user to authorize
    const oauthUrl = `${config.authUrl}?client_id=${
      process.env[`${server.type.toUpperCase()}_CLIENT_ID`]
    }&scope=${config.scopes.join(' ')}&redirect_uri=${encodeURIComponent(
      `${process.env.NEXTAUTH_URL}/api/mcp/${id}/callback`
    )}`;

    return Response.json({
      ok: true,
      status: 'connected',
      oauthUrl: credentials ? null : oauthUrl,
      message: credentials ? 'Connected successfully' : 'Please authorize in the popup',
    });
  } catch (error) {
    console.error('[mcp] connect failed:', error);
    return Response.json({ error: 'Failed to connect' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.mcpServer.update({
      where: { id, userId: session.user.id },
      data: { status: 'disconnected', config: {} },
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error('[mcp] disconnect failed:', error);
    return Response.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
