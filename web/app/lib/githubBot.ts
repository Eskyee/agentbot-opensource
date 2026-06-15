import { prisma } from '@/app/lib/prisma'
import { decryptToken, encryptToken } from '@/app/lib/token-encryption'

export const GITHUB_BOT_SETTING_KEY = 'github_bot_account'

export interface GitHubBotConfig {
  token: string
  username: string
  email: string
  repoAllowlist?: string[] | null
}

export async function getStoredGitHubBot(userId: string): Promise<Omit<GitHubBotConfig, 'token'> | null> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: GITHUB_BOT_SETTING_KEY } },
  })
  if (!setting) return null

  try {
    const decrypted = decryptToken(setting.value)
    const parsed = JSON.parse(decrypted) as GitHubBotConfig
    return {
      username: parsed.username,
      email: parsed.email,
      repoAllowlist: parsed.repoAllowlist || [],
    }
  } catch {
    return null
  }
}

export async function getStoredGitHubBotSecret(userId: string): Promise<GitHubBotConfig | null> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: GITHUB_BOT_SETTING_KEY } },
  })
  if (!setting) return null

  try {
    const decrypted = decryptToken(setting.value)
    return JSON.parse(decrypted) as GitHubBotConfig
  } catch {
    return null
  }
}

export async function saveGitHubBot(userId: string, account: GitHubBotConfig) {
  const encrypted = encryptToken(JSON.stringify(account))
  await prisma.userSetting.upsert({
    where: { userId_key: { userId, key: GITHUB_BOT_SETTING_KEY } },
    update: { value: encrypted },
    create: { userId, key: GITHUB_BOT_SETTING_KEY, value: encrypted },
  })
}

export async function deleteGitHubBot(userId: string) {
  await prisma.userSetting.deleteMany({
    where: { userId, key: GITHUB_BOT_SETTING_KEY },
  })
}
