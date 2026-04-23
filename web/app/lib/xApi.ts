import { prisma } from '@/app/lib/prisma'
import { decryptToken, encryptToken } from '@/app/lib/token-encryption'

export const X_ACCOUNT_SETTING_KEY = 'x_api_account'

export interface XAccountConfig {
  accessToken: string
  refreshToken?: string | null
  username?: string | null
  accountId?: string | null
  scopes?: string[] | null
}

export interface XSearchSignal {
  id: string
  author: string
  content: string
  url: string
  upvotes: number
  comments: number
  date: string
  relevance: 'high' | 'medium' | 'low'
  tags: string[]
}

export interface XMention {
  id: string
  author: string
  authorUsername: string
  text: string
  createdAt: string
  conversationId: string | null
  inReplyToUserId: string | null
  publicMetrics: {
    likeCount: number
    replyCount: number
    repostCount: number
  }
  url: string
}

export interface XUserPost {
  id: string
  text: string
  createdAt: string
  publicMetrics: {
    likeCount: number
    replyCount: number
    repostCount: number
    quoteCount: number
  }
  url: string
}

export function getXApiAppStatus() {
  return {
    bearerTokenConfigured: Boolean(process.env.X_API_BEARER_TOKEN),
    oauthClientConfigured: Boolean(process.env.X_API_CLIENT_ID && process.env.X_API_CLIENT_SECRET),
    appKeyConfigured: Boolean(process.env.X_API_KEY && process.env.X_API_KEY_SECRET),
    callbackUrl: process.env.X_API_CALLBACK_URL || null,
  }
}

export async function fetchRecentXSignals(query: string): Promise<XSearchSignal[]> {
  const bearerToken = process.env.X_API_BEARER_TOKEN
  if (!bearerToken) return []

  const params = new URLSearchParams({
    query,
    max_results: '10',
    'tweet.fields': 'author_id,created_at,public_metrics',
    expansions: 'author_id',
    'user.fields': 'username',
  })

  const response = await fetch(`https://api.x.com/2/tweets/search/recent?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`X recent search failed: ${response.status} ${errorText}`)
  }

  const payload = await response.json()
  const tweets = Array.isArray(payload?.data) ? payload.data : []
  const users = Array.isArray(payload?.includes?.users) ? payload.includes.users : []
  const userMap = new Map(users.map((user: { id: string; username?: string }) => [user.id, user.username || 'unknown']))

  const keywords = ['agent', 'agents', 'ai', 'automation', 'openclaw', 'basefm', 'x402', 'social']

  return tweets.map((tweet: any) => {
    const text = String(tweet.text || '')
    const lowered = text.toLowerCase()
    const tags = keywords.filter((keyword) => lowered.includes(keyword)).slice(0, 3)
    const likes = Number(tweet.public_metrics?.like_count || 0)
    const replies = Number(tweet.public_metrics?.reply_count || 0)
    const relevance: 'high' | 'medium' | 'low' =
      likes > 100 || replies > 20 || tags.length >= 2 ? 'high' : likes > 20 || replies > 5 ? 'medium' : 'low'

    return {
      id: `twitter-${tweet.id}`,
      author: userMap.get(String(tweet.author_id)) || 'unknown',
      content: text,
      url: `https://x.com/${userMap.get(String(tweet.author_id)) || 'i'}/status/${tweet.id}`,
      upvotes: likes,
      comments: replies,
      date: String(tweet.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
      relevance,
      tags,
    }
  })
}

export async function getStoredXAccount(userId: string): Promise<Omit<XAccountConfig, 'accessToken' | 'refreshToken'> | null> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: X_ACCOUNT_SETTING_KEY } },
  })
  if (!setting) return null

  try {
    const decrypted = decryptToken(setting.value)
    const parsed = JSON.parse(decrypted) as XAccountConfig
    return {
      username: parsed.username || null,
      accountId: parsed.accountId || null,
      scopes: parsed.scopes || [],
    }
  } catch {
    return null
  }
}

export async function getStoredXAccountSecret(userId: string): Promise<XAccountConfig | null> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: X_ACCOUNT_SETTING_KEY } },
  })
  if (!setting) return null

  try {
    const decrypted = decryptToken(setting.value)
    return JSON.parse(decrypted) as XAccountConfig
  } catch {
    return null
  }
}

export async function saveXAccount(userId: string, account: XAccountConfig) {
  const encrypted = encryptToken(JSON.stringify(account))
  await prisma.userSetting.upsert({
    where: { userId_key: { userId, key: X_ACCOUNT_SETTING_KEY } },
    update: { value: encrypted },
    create: { userId, key: X_ACCOUNT_SETTING_KEY, value: encrypted },
  })
}

export async function deleteXAccount(userId: string) {
  await prisma.userSetting.deleteMany({
    where: { userId, key: X_ACCOUNT_SETTING_KEY },
  })
}

async function refreshXAccessToken(userId: string): Promise<XAccountConfig | null> {
  const account = await getStoredXAccountSecret(userId)
  if (!account?.refreshToken) return null

  const clientId = process.env.X_API_CLIENT_ID
  const clientSecret = process.env.X_API_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: account.refreshToken,
      client_id: clientId,
    }),
  })

  if (!res.ok) {
    console.error('X refresh_token failed:', res.status, await res.text())
    return null
  }

  const payload = await res.json()
  const accessToken = payload?.access_token as string | undefined
  if (!accessToken) return null

  const refreshed: XAccountConfig = {
    accessToken,
    refreshToken: (payload?.refresh_token as string | undefined) || account.refreshToken,
    username: account.username,
    accountId: account.accountId,
    scopes: typeof payload?.scope === 'string' ? payload.scope.split(' ') : account.scopes,
  }
  await saveXAccount(userId, refreshed)
  return refreshed
}

async function xAuthFetch(
  userId: string,
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const account = await getStoredXAccountSecret(userId)
  if (!account?.accessToken) {
    throw new Error('No connected X account found')
  }

  const withAuth = (token: string): RequestInit => ({
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  })

  let response = await fetch(url, withAuth(account.accessToken))
  if (response.status !== 401) return response

  const refreshed = await refreshXAccessToken(userId)
  if (!refreshed?.accessToken) return response

  response = await fetch(url, withAuth(refreshed.accessToken))
  return response
}

export async function publishPostToX(userId: string, text: string) {
  const account = await getStoredXAccountSecret(userId)
  if (!account?.accessToken) {
    throw new Error('No connected X account found')
  }

  const response = await xAuthFetch(userId, 'https://api.x.com/2/tweets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`X publish failed: ${response.status} ${errorText}`)
  }

  const payload = await response.json()
  const postId = payload?.data?.id ? String(payload.data.id) : null
  const username = account.username || 'i'

  return {
    postId,
    url: postId ? `https://x.com/${username}/status/${postId}` : null,
    payload,
  }
}

export async function fetchUserMentionsFromX(userId: string): Promise<XMention[]> {
  const account = await getStoredXAccountSecret(userId)
  if (!account?.accessToken || !account.accountId) {
    throw new Error('No connected X account found')
  }

  const params = new URLSearchParams({
    max_results: '10',
    expansions: 'author_id',
    'tweet.fields': 'author_id,created_at,conversation_id,in_reply_to_user_id,public_metrics',
    'user.fields': 'username,name',
  })

  const response = await xAuthFetch(
    userId,
    `https://api.x.com/2/users/${account.accountId}/mentions?${params.toString()}`,
    { signal: AbortSignal.timeout(8000), cache: 'no-store' }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`X mentions failed: ${response.status} ${errorText}`)
  }

  const payload = await response.json()
  const tweets = Array.isArray(payload?.data) ? payload.data : []
  const users = Array.isArray(payload?.includes?.users) ? payload.includes.users : []
  const userMap = new Map<string, { username: string; name: string }>(
    users.map((user: { id: string; username?: string; name?: string }) => [
      user.id,
      {
        username: user.username || 'unknown',
        name: user.name || user.username || 'unknown',
      },
    ])
  )

  return tweets.map((tweet: any) => {
    const author = userMap.get(String(tweet.author_id))
    const authorUsername = author?.username || 'unknown'
    return {
      id: String(tweet.id),
      author: author?.name || authorUsername,
      authorUsername,
      text: String(tweet.text || ''),
      createdAt: String(tweet.created_at || new Date().toISOString()),
      conversationId: tweet.conversation_id ? String(tweet.conversation_id) : null,
      inReplyToUserId: tweet.in_reply_to_user_id ? String(tweet.in_reply_to_user_id) : null,
      publicMetrics: {
        likeCount: Number(tweet.public_metrics?.like_count || 0),
        replyCount: Number(tweet.public_metrics?.reply_count || 0),
        repostCount: Number(tweet.public_metrics?.retweet_count || tweet.public_metrics?.repost_count || 0),
      },
      url: `https://x.com/${authorUsername}/status/${tweet.id}`,
    }
  })
}

export async function fetchUserPostsFromX(userId: string): Promise<XUserPost[]> {
  const account = await getStoredXAccountSecret(userId)
  if (!account?.accessToken || !account.accountId) {
    throw new Error('No connected X account found')
  }

  const params = new URLSearchParams({
    max_results: '10',
    'tweet.fields': 'created_at,public_metrics',
  })

  const response = await xAuthFetch(
    userId,
    `https://api.x.com/2/users/${account.accountId}/tweets?${params.toString()}`,
    { signal: AbortSignal.timeout(8000), cache: 'no-store' }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`X posts failed: ${response.status} ${errorText}`)
  }

  const payload = await response.json()
  const tweets = Array.isArray(payload?.data) ? payload.data : []
  const username = account.username || 'i'

  return tweets.map((tweet: any) => ({
    id: String(tweet.id),
    text: String(tweet.text || ''),
    createdAt: String(tweet.created_at || new Date().toISOString()),
    publicMetrics: {
      likeCount: Number(tweet.public_metrics?.like_count || 0),
      replyCount: Number(tweet.public_metrics?.reply_count || 0),
      repostCount: Number(tweet.public_metrics?.retweet_count || tweet.public_metrics?.repost_count || 0),
      quoteCount: Number(tweet.public_metrics?.quote_count || 0),
    },
    url: `https://x.com/${username}/status/${tweet.id}`,
  }))
}

export interface XCommunityPost {
  id: string
  author: string
  authorUsername: string
  text: string
  createdAt: string
  publicMetrics: {
    likeCount: number
    replyCount: number
    repostCount: number
  }
  url: string
}

export async function fetchCommunityPostsFromX(
  userId: string,
  communityId: string
): Promise<XCommunityPost[]> {
  const account = await getStoredXAccountSecret(userId)
  if (!account?.accessToken) {
    throw new Error('No connected X account found')
  }
  if (!/^\d+$/.test(communityId)) {
    throw new Error('Invalid community id')
  }

  const params = new URLSearchParams({
    max_results: '10',
    expansions: 'author_id',
    'tweet.fields': 'author_id,created_at,public_metrics',
    'user.fields': 'username,name',
  })

  let response = await xAuthFetch(
    userId,
    `https://api.x.com/2/communities/${communityId}/tweets?${params.toString()}`,
    { signal: AbortSignal.timeout(8000), cache: 'no-store' }
  )

  if (response.status === 404 || response.status === 403) {
    const searchParams = new URLSearchParams({
      query: `context:131.${communityId}`,
      max_results: '10',
      expansions: 'author_id',
      'tweet.fields': 'author_id,created_at,public_metrics',
      'user.fields': 'username,name',
    })
    response = await xAuthFetch(
      userId,
      `https://api.x.com/2/tweets/search/recent?${searchParams.toString()}`,
      { signal: AbortSignal.timeout(8000), cache: 'no-store' }
    )
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`X community failed: ${response.status} ${errorText}`)
  }

  const payload = await response.json()
  const tweets = Array.isArray(payload?.data) ? payload.data : []
  const users = Array.isArray(payload?.includes?.users) ? payload.includes.users : []
  const userMap = new Map<string, { username: string; name: string }>(
    users.map((user: { id: string; username?: string; name?: string }) => [
      user.id,
      { username: user.username || 'unknown', name: user.name || user.username || 'unknown' },
    ])
  )

  return tweets.map((tweet: any) => {
    const author = userMap.get(String(tweet.author_id))
    const authorUsername = author?.username || 'unknown'
    return {
      id: String(tweet.id),
      author: author?.name || authorUsername,
      authorUsername,
      text: String(tweet.text || ''),
      createdAt: String(tweet.created_at || new Date().toISOString()),
      publicMetrics: {
        likeCount: Number(tweet.public_metrics?.like_count || 0),
        replyCount: Number(tweet.public_metrics?.reply_count || 0),
        repostCount: Number(tweet.public_metrics?.retweet_count || tweet.public_metrics?.repost_count || 0),
      },
      url: `https://x.com/${authorUsername}/status/${tweet.id}`,
    }
  })
}
