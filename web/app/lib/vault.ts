import { randomUUID } from 'crypto'
import { prisma } from '@/app/lib/prisma'
import { decryptToken } from '@/app/lib/token-encryption'

const X_ACCOUNT_SETTING_KEY = 'x_api_account'
const BANKR_API_KEY_SETTING_KEY = 'bankr_api_key'
const GITHUB_BOT_SETTING_KEY = 'github_bot_account'

export type ManagedVaultCredential = {
  id: string
  provider: string
  kind: 'static_bearer'
  configured: boolean
  mcpServerUrl: string | null
  displayName: string
}

function getConfiguredMcpUrl(provider: string) {
  if (provider === 'x') return process.env.AGENTBOT_X_MCP_URL || null
  if (provider === 'github') return process.env.AGENTBOT_GITHUB_MCP_URL || null
  if (provider === 'notion') return process.env.AGENTBOT_NOTION_MCP_URL || null
  if (provider === 'slack') return process.env.AGENTBOT_SLACK_MCP_URL || null
  if (provider === 'bankr') return process.env.AGENTBOT_BANKR_MCP_URL || null
  return null
}

async function hasEncryptedUserSetting(userId: string, key: string) {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key } },
  })

  if (!setting) return false

  try {
    decryptToken(setting.value)
    return true
  } catch {
    return false
  }
}

export async function getOrCreateVaultForUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { vaultId: true },
  })

  if (user?.vaultId) return user.vaultId

  const vaultId = `vault_${randomUUID()}`
  await prisma.user.update({
    where: { id: userId },
    data: { vaultId },
  })

  return vaultId
}

export async function listVaultCredentialsForUser(userId: string): Promise<ManagedVaultCredential[]> {
  const [hasXAccount, hasBankrKey, hasGitHubBot] = await Promise.all([
    hasEncryptedUserSetting(userId, X_ACCOUNT_SETTING_KEY),
    hasEncryptedUserSetting(userId, BANKR_API_KEY_SETTING_KEY),
    hasEncryptedUserSetting(userId, GITHUB_BOT_SETTING_KEY),
  ])

  return [
    {
      id: `x:${userId}`,
      provider: 'x',
      kind: 'static_bearer',
      configured: hasXAccount,
      mcpServerUrl: getConfiguredMcpUrl('x'),
      displayName: 'X Account Token',
    },
    {
      id: `github:${userId}`,
      provider: 'github',
      kind: 'static_bearer',
      configured: hasGitHubBot,
      mcpServerUrl: getConfiguredMcpUrl('github'),
      displayName: 'GitHub Bot Token',
    },
    {
      id: `bankr:${userId}`,
      provider: 'bankr',
      kind: 'static_bearer',
      configured: hasBankrKey,
      mcpServerUrl: getConfiguredMcpUrl('bankr'),
      displayName: 'Bankr API Key',
    },
  ].filter((credential) => credential.configured)
}

export async function buildManagedVaultContextForUser(userId: string) {
  const vaultId = await getOrCreateVaultForUser(userId)
  const credentials = await listVaultCredentialsForUser(userId)

  return {
    vaultId,
    credentials,
    credentialIds: credentials.map((credential) => credential.id),
  }
}
