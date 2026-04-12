import crypto from 'crypto'
import { prisma } from '@/app/lib/prisma'
import { decryptToken, encryptToken } from '@/app/lib/token-encryption'

const GITLAWB_NETWORK_TOPIC = 'gitlawb/ref-updates/v1'

type AgentConfigShape = Record<string, unknown> & {
  gitlawb?: GitlawbAgentState
}

export type GitlawbEnrollmentStatus = 'disconnected' | 'identity_ready'

export interface GitlawbAgentState {
  status: GitlawbEnrollmentStatus
  did: string
  publicKeyMultibase: string
  repo: string
  webUrl: string
  cloneUrl: string
  topic: string
  enrolledAt: string
  lastUpdatedAt: string
}

interface StoredGitlawbIdentity {
  did: string
  publicKeyMultibase: string
  privateKeyPkcs8Pem: string
  publicKeySpkiPem: string
}

function getSettingKey(agentId: string) {
  return `gitlawb_identity:${agentId}`
}

function slugifyRepoName(name: string, fallback: string) {
  const base = (name || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return base || fallback.toLowerCase()
}

function encodeBase58(buffer: Uint8Array) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let value = BigInt(`0x${Buffer.from(buffer).toString('hex') || '0'}`)
  let output = ''

  while (value > 0n) {
    const mod = Number(value % 58n)
    output = alphabet[mod] + output
    value /= 58n
  }

  for (const byte of buffer) {
    if (byte === 0) {
      output = alphabet[0] + output
    } else {
      break
    }
  }

  return output || alphabet[0]
}

function toDidKeyFromJwkX(x: string) {
  const publicKeyBytes = Buffer.from(x, 'base64url')
  const prefixed = Buffer.concat([Buffer.from([0xed, 0x01]), publicKeyBytes])
  const multibase = `z${encodeBase58(prefixed)}`
  return {
    did: `did:key:${multibase}`,
    publicKeyMultibase: multibase,
  }
}

function generateGitlawbIdentity(): StoredGitlawbIdentity {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
  const jwk = publicKey.export({ format: 'jwk' }) as JsonWebKey
  if (!jwk.x) {
    throw new Error('Failed to derive Gitlawb DID from generated Ed25519 key')
  }

  const { did, publicKeyMultibase } = toDidKeyFromJwkX(jwk.x)

  return {
    did,
    publicKeyMultibase,
    privateKeyPkcs8Pem: privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
    publicKeySpkiPem: publicKey.export({ format: 'pem', type: 'spki' }).toString(),
  }
}

async function getAgent(userId: string, agentId: string) {
  return prisma.agent.findFirst({
    where: { id: agentId, userId },
    select: {
      id: true,
      userId: true,
      name: true,
      config: true,
    },
  })
}

async function getStoredIdentity(userId: string, agentId: string): Promise<StoredGitlawbIdentity | null> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: getSettingKey(agentId) } },
  })

  if (!setting) return null

  try {
    return JSON.parse(decryptToken(setting.value)) as StoredGitlawbIdentity
  } catch {
    return null
  }
}

async function saveStoredIdentity(userId: string, agentId: string, identity: StoredGitlawbIdentity) {
  const encrypted = encryptToken(JSON.stringify(identity))
  await prisma.userSetting.upsert({
    where: { userId_key: { userId, key: getSettingKey(agentId) } },
    update: { value: encrypted },
    create: {
      userId,
      key: getSettingKey(agentId),
      value: encrypted,
    },
  })
}

function buildGitlawbState(args: {
  identity: StoredGitlawbIdentity
  repo: string
  existing?: GitlawbAgentState | null
}): GitlawbAgentState {
  const now = new Date().toISOString()
  const repoPath = `${args.identity.did.replace('did:key:', '')}/${args.repo}`
  return {
    status: 'identity_ready',
    did: args.identity.did,
    publicKeyMultibase: args.identity.publicKeyMultibase,
    repo: args.repo,
    webUrl: `https://gitlawb.com/${repoPath}`,
    cloneUrl: `git clone gitlawb://${args.identity.did}/${args.repo}`,
    topic: GITLAWB_NETWORK_TOPIC,
    enrolledAt: args.existing?.enrolledAt || now,
    lastUpdatedAt: now,
  }
}

export async function connectAgentToGitlawb(userId: string, agentId: string) {
  const agent = await getAgent(userId, agentId)
  if (!agent) {
    throw new Error('Agent not found')
  }

  const existingConfig = (agent.config as AgentConfigShape | null) || {}
  const existingState = existingConfig.gitlawb || null
  const storedIdentity = (await getStoredIdentity(userId, agentId)) || generateGitlawbIdentity()
  if (!existingState) {
    await saveStoredIdentity(userId, agentId, storedIdentity)
  }

  const repo = existingState?.repo || slugifyRepoName(agent.name, agent.id)
  const gitlawbState = buildGitlawbState({
    identity: storedIdentity,
    repo,
    existing: existingState,
  })

  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      config: {
        ...existingConfig,
        gitlawb: gitlawbState,
      },
    },
  })

  return gitlawbState
}

export async function disconnectAgentFromGitlawb(userId: string, agentId: string) {
  const agent = await getAgent(userId, agentId)
  if (!agent) {
    throw new Error('Agent not found')
  }

  const existingConfig = (agent.config as AgentConfigShape | null) || {}
  const existingState = existingConfig.gitlawb || null
  if (!existingState) return null

  const nextState: GitlawbAgentState = {
    ...existingState,
    status: 'disconnected',
    lastUpdatedAt: new Date().toISOString(),
  }

  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      config: {
        ...existingConfig,
        gitlawb: nextState,
      },
    },
  })

  return nextState
}

export async function listGitlawbAgentsForUser(userId: string) {
  const agents = await prisma.agent.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      status: true,
      model: true,
      config: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return agents.map((agent) => {
    const config = (agent.config as AgentConfigShape | null) || {}
    return {
      id: agent.id,
      name: agent.name,
      status: agent.status,
      model: agent.model,
      updatedAt: agent.updatedAt.toISOString(),
      gitlawb: config.gitlawb || null,
    }
  })
}
