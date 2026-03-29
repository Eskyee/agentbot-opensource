import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

const SETTING_KEY = 'openclaw_config'
const BACKUP_KEY  = 'openclaw_config_backups'

// Default config matching the official OpenClaw schema.
// Field paths per CLI Setup Reference (outputs and internals):
//   agents.defaults.model / agents.defaults.workspace
//   tools.profile
//   gateway.* (bind, auth)
//   session.dmScope / session.resetTriggers
//   channels.*
//   skills.install.nodeManager
const DEFAULT_CONFIG = {
  logging: { level: 'info' },
  agents: {
    defaults: {
      model: 'anthropic/claude-opus-4-5',
      workspace: '~/.openclaw/workspace',
    },
  },
  tools: {
    // 'coding' for collective+ plans, 'messaging' for solo
    profile: 'coding',
  },
  gateway: {
    bind: 'lan',
    auth: { mode: 'token' },
  },
  channels: {
    whatsapp: {
      // Security: add your phone number to restrict who can message the agent
      allowFrom: [],
    },
    telegram: { enabled: false },
    discord:  { enabled: false },
    webchat:  { enabled: true  },
  },
  session: {
    // per-channel-peer = each sender gets their own session (official default)
    dmScope: 'per-channel-peer',
    resetTriggers: ['/new', '/reset'],
  },
  skills: {
    install: { nodeManager: 'npm' },
  },
}

interface ConfigBackup {
  id: string
  timestamp: string
  config: Record<string, unknown>
}

async function getConfig(userId: string): Promise<Record<string, unknown>> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: SETTING_KEY } },
  })
  if (!setting) return DEFAULT_CONFIG
  try { return JSON.parse(setting.value) } catch { return DEFAULT_CONFIG }
}

async function saveConfigToDb(userId: string, config: Record<string, unknown>) {
  await prisma.userSetting.upsert({
    where: { userId_key: { userId, key: SETTING_KEY } },
    update: { value: JSON.stringify(config) },
    create: { userId, key: SETTING_KEY, value: JSON.stringify(config) },
  })
}

async function getBackups(userId: string): Promise<ConfigBackup[]> {
  const setting = await prisma.userSetting.findUnique({
    where: { userId_key: { userId, key: BACKUP_KEY } },
  })
  if (!setting) return []
  try { return JSON.parse(setting.value) } catch { return [] }
}

async function saveBackupsToDb(userId: string, backups: ConfigBackup[]) {
  const trimmed = backups.slice(0, 10)
  await prisma.userSetting.upsert({
    where: { userId_key: { userId, key: BACKUP_KEY } },
    update: { value: JSON.stringify(trimmed) },
    create: { userId, key: BACKUP_KEY, value: JSON.stringify(trimmed) },
  })
}

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [config, backups] = await Promise.all([
    getConfig(session.user.id),
    getBackups(session.user.id),
  ])

  return NextResponse.json({
    config,
    backups: backups.map(b => ({ id: b.id, timestamp: b.timestamp })),
  })
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Invalid config object' }, { status: 400 })
    }

    // Validate JSON structure
    try {
      JSON.parse(JSON.stringify(config))
    } catch {
      return NextResponse.json({ error: 'Config is not valid JSON' }, { status: 400 })
    }

    const [currentConfig, existingBackups] = await Promise.all([
      getConfig(session.user.id),
      getBackups(session.user.id),
    ])

    // Create backup of current config before saving
    const backup: ConfigBackup = {
      id: `bkp_${Date.now()}`,
      timestamp: new Date().toISOString(),
      config: JSON.parse(JSON.stringify(currentConfig)),
    }
    const newBackups = [backup, ...existingBackups].slice(0, 10)

    await Promise.all([
      saveConfigToDb(session.user.id, config),
      saveBackupsToDb(session.user.id, newBackups),
    ])

    return NextResponse.json({
      success: true,
      config,
      backupId: backup.id,
      backups: newBackups.map(b => ({ id: b.id, timestamp: b.timestamp })),
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { backupId } = body

    if (!backupId) {
      return NextResponse.json({ error: 'Missing backupId' }, { status: 400 })
    }

    const [currentConfig, existingBackups] = await Promise.all([
      getConfig(session.user.id),
      getBackups(session.user.id),
    ])

    const backup = existingBackups.find(b => b.id === backupId)
    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 })
    }

    // Save current as a new backup before restoring
    const preRestoreBackup: ConfigBackup = {
      id: `bkp_${Date.now()}`,
      timestamp: new Date().toISOString(),
      config: JSON.parse(JSON.stringify(currentConfig)),
    }
    const newBackups = [preRestoreBackup, ...existingBackups].slice(0, 10)
    const restoredConfig = JSON.parse(JSON.stringify(backup.config))

    await Promise.all([
      saveConfigToDb(session.user.id, restoredConfig),
      saveBackupsToDb(session.user.id, newBackups),
    ])

    return NextResponse.json({
      success: true,
      config: restoredConfig,
      restoredFrom: backupId,
      backups: newBackups.map(b => ({ id: b.id, timestamp: b.timestamp })),
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
