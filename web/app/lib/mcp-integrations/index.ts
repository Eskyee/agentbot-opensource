/**
 * MCP Integrations — shared store for OAuth credentials.
 *
 * Each integration stores its tokens in UserSetting (AES-256-GCM encrypted),
 * keyed by `mcp_{provider}`. The value is a JSON blob with at minimum:
 *   { accessToken, refreshToken?, expiresAt?, meta? }
 *
 * Provider configs define OAuth endpoints, scopes, and env-var names.
 */

import { prisma } from '@/app/lib/prisma'
import { decryptToken, encryptToken } from '@/app/lib/token-encryption'

export type McpProvider =
  | 'slack'
  | 'github'
  | 'linear'
  | 'sentry'
  | 'datadog'
  | 'notion'
  | 'jira'
  | 'figma'

export interface McpConnection {
  provider: McpProvider
  connected: boolean
  meta?: Record<string, string>
  connectedAt?: string
}

export interface McpTokenPayload {
  accessToken: string
  refreshToken?: string | null
  expiresAt?: number | undefined
  meta?: Record<string, string>
}

export interface McpProviderConfig {
  name: string
  description: string
  icon: string
  iconBg: string
  capabilities: string[]
  authUrl: string
  tokenUrl: string
  scopes: string[]
  envClientId: string
  envClientSecret: string
  envCallbackUrl: string
  apiBaseUrl: string
}

export const PROVIDERS: Record<McpProvider, McpProviderConfig> = {
  slack: {
    name: 'Slack',
    description: 'Read/write messages, channels, reactions',
    icon: '💬',
    iconBg: 'bg-purple-500/10 border-purple-500/30',
    capabilities: ['Read/write messages', 'Channel management', 'Reactions', 'Threads'],
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: ['channels:read', 'channels:write', 'chat:write', 'reactions:read', 'reactions:write', 'users:read'],
    envClientId: 'SLACK_CLIENT_ID',
    envClientSecret: 'SLACK_CLIENT_SECRET',
    envCallbackUrl: 'MCP_SLACK_CALLBACK_URL',
    apiBaseUrl: 'https://slack.com/api',
  },
  github: {
    name: 'GitHub',
    description: 'Repos, PRs, issues, actions, CI',
    icon: '🐙',
    iconBg: 'bg-zinc-500/10 border-zinc-500/30',
    capabilities: ['Repos', 'Pull Requests', 'Issues', 'Actions', 'CI/CD'],
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['repo', 'read:org', 'workflow'],
    envClientId: 'GITHUB_CLIENT_ID',
    envClientSecret: 'GITHUB_CLIENT_SECRET',
    envCallbackUrl: 'MCP_GITHUB_CALLBACK_URL',
    apiBaseUrl: 'https://api.github.com',
  },
  linear: {
    name: 'Linear',
    description: 'Issues, projects, teams, labels',
    icon: '📋',
    iconBg: 'bg-indigo-500/10 border-indigo-500/30',
    capabilities: ['Issues', 'Projects', 'Teams', 'Labels', 'Cycles'],
    authUrl: 'https://linear.app/oauth/authorize',
    tokenUrl: 'https://api.linear.app/oauth/token',
    scopes: ['issues:create', 'issues:read', 'projects:read', 'teams:read'],
    envClientId: 'LINEAR_CLIENT_ID',
    envClientSecret: 'LINEAR_CLIENT_SECRET',
    envCallbackUrl: 'MCP_LINEAR_CALLBACK_URL',
    apiBaseUrl: 'https://api.linear.app/graphql',
  },
  sentry: {
    name: 'Sentry',
    description: 'Errors, performance, releases',
    icon: '🔍',
    iconBg: 'bg-red-500/10 border-red-500/30',
    capabilities: ['Errors', 'Performance', 'Releases', 'Alerts'],
    authUrl: 'https://sentry.io/oauth/authorize',
    tokenUrl: 'https://sentry.io/api/0/oauth/token/',
    scopes: ['event:read', 'org:read', 'project:read', 'releases:read'],
    envClientId: 'SENTRY_CLIENT_ID',
    envClientSecret: 'SENTRY_CLIENT_SECRET',
    envCallbackUrl: 'MCP_SENTRY_CALLBACK_URL',
    apiBaseUrl: 'https://sentry.io/api/0',
  },
  datadog: {
    name: 'Datadog',
    description: 'Metrics, logs, traces, monitors',
    icon: '📊',
    iconBg: 'bg-purple-600/10 border-purple-600/30',
    capabilities: ['Metrics', 'Logs', 'Traces', 'Monitors', 'Dashboards'],
    authUrl: 'https://app.datadoghq.com/account/login',
    tokenUrl: 'https://api.datadoghq.com/api/v2/oauth/token',
    scopes: ['api_keys', 'logs_read', 'metrics_read', 'apm_read'],
    envClientId: 'DATADOG_CLIENT_ID',
    envClientSecret: 'DATADOG_CLIENT_SECRET',
    envCallbackUrl: 'MCP_DATADOG_CALLBACK_URL',
    apiBaseUrl: 'https://api.datadoghq.com/api/v2',
  },
  notion: {
    name: 'Notion',
    description: 'Pages, databases, wikis',
    icon: '📝',
    iconBg: 'bg-zinc-500/10 border-zinc-400/30',
    capabilities: ['Pages', 'Databases', 'Wikis', 'Blocks'],
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: [],
    envClientId: 'NOTION_CLIENT_ID',
    envClientSecret: 'NOTION_CLIENT_SECRET',
    envCallbackUrl: 'MCP_NOTION_CALLBACK_URL',
    apiBaseUrl: 'https://api.notion.com/v1',
  },
  jira: {
    name: 'Jira',
    description: 'Issues, sprints, boards',
    icon: '🎫',
    iconBg: 'bg-blue-500/10 border-blue-500/30',
    capabilities: ['Issues', 'Sprints', 'Boards', 'Projects'],
    authUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scopes: ['read:jira-work', 'write:jira-work', 'read:jira-project'],
    envClientId: 'JIRA_CLIENT_ID',
    envClientSecret: 'JIRA_CLIENT_SECRET',
    envCallbackUrl: 'MCP_JIRA_CALLBACK_URL',
    apiBaseUrl: 'https://api.atlassian.com/oauth/2/authorized-token',
  },
  figma: {
    name: 'Figma',
    description: 'Designs, components, prototypes',
    icon: '🎨',
    iconBg: 'bg-violet-500/10 border-violet-500/30',
    capabilities: ['Designs', 'Components', 'Prototypes', 'Comments'],
    authUrl: 'https://www.figma.com/oauth',
    tokenUrl: 'https://www.figma.com/api/oauth/token',
    scopes: ['file_read', 'file_write', 'comment_write'],
    envClientId: 'FIGMA_CLIENT_ID',
    envClientSecret: 'FIGMA_CLIENT_SECRET',
    envCallbackUrl: 'MCP_FIGMA_CALLBACK_URL',
    apiBaseUrl: 'https://api.figma.com/v1',
  },
}

function settingKey(provider: McpProvider): string {
  return `mcp_${provider}`
}

export async function getMcpConnection(
  userId: string,
  provider: McpProvider,
): Promise<McpConnection> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: settingKey(provider) } },
  })

  if (!setting) {
    return { provider, connected: false }
  }

  try {
    const decrypted = decryptToken(setting.value)
    const payload: McpTokenPayload = JSON.parse(decrypted)
    const expired = payload.expiresAt && payload.expiresAt < Date.now()
    return {
      provider,
      connected: !expired,
      meta: payload.meta,
      connectedAt: setting.updatedAt.toISOString(),
    }
  } catch {
    return { provider, connected: false }
  }
}

export async function getAllConnections(
  userId: string,
): Promise<McpConnection[]> {
  const providers = Object.keys(PROVIDERS) as McpProvider[]
  const connections = await Promise.all(
    providers.map((p) => getMcpConnection(userId, p)),
  )
  return connections
}

export async function saveMcpTokens(
  userId: string,
  provider: McpProvider,
  payload: McpTokenPayload,
): Promise<void> {
  const encrypted = encryptToken(JSON.stringify(payload))
  await prisma.userSetting.upsert({
    where: { userId_key: { userId, key: settingKey(provider) } },
    create: { userId, key: settingKey(provider), value: encrypted },
    update: { value: encrypted },
  })
}

export async function disconnectMcp(
  userId: string,
  provider: McpProvider,
): Promise<void> {
  await prisma.userSetting.deleteMany({
    where: { userId, key: settingKey(provider) },
  })
}

export async function getMcpAccessToken(
  userId: string,
  provider: McpProvider,
): Promise<string | null> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: settingKey(provider) } },
  })
  if (!setting) return null
  try {
    const decrypted = decryptToken(setting.value)
    const payload: McpTokenPayload = JSON.parse(decrypted)
    if (payload.expiresAt && payload.expiresAt < Date.now()) return null
    return payload.accessToken
  } catch {
    return null
  }
}

export function getProviderConfig(provider: McpProvider): McpProviderConfig {
  return PROVIDERS[provider]
}

export function buildOAuthStartUrl(
  provider: McpProvider,
  state: string,
): string {
  const config = PROVIDERS[provider]
  const clientId = process.env[config.envClientId]
  const callbackUrl = process.env[config.envCallbackUrl]
  if (!clientId || !callbackUrl) return ''

  if (provider === 'slack') {
    const params = new URLSearchParams({
      client_id: clientId,
      scope: config.scopes.join(' '),
      redirect_uri: callbackUrl,
      state,
    })
    return `${config.authUrl}?${params.toString()}`
  }

  if (provider === 'github') {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: config.scopes.join(' '),
      state,
    })
    return `${config.authUrl}?${params.toString()}`
  }

  if (provider === 'notion') {
    // Notion's public OAuth authorize endpoint requires `owner=user`; without
    // it the authorization request is rejected before reaching the consent screen.
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      owner: 'user',
      state,
    })
    return `${config.authUrl}?${params.toString()}`
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: config.scopes.join(' '),
    state,
    response_type: 'code',
  })
  return `${config.authUrl}?${params.toString()}`
}
