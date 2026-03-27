import { NextResponse } from 'next/server'

interface ConfigBackup {
  id: string
  timestamp: string
  config: Record<string, unknown>
}

let currentConfig: Record<string, unknown> = {
  version: '2026.3.23',
  model: {
    default: 'openrouter/auto',
    fallbacks: ['openrouter/anthropic/claude-3.5-sonnet'],
  },
  channels: {
    telegram: { enabled: true },
    discord: { enabled: false },
    webchat: { enabled: true },
  },
  memory: { maxEntries: 1000, ttlDays: 90 },
  cron: { heartbeatIntervalMinutes: 30 },
  safety: { maxTokensPerDay: 100000, allowedDomains: [] },
}

let backups: ConfigBackup[] = [
  {
    id: 'bkp_initial',
    timestamp: '2026-03-27T10:00:00Z',
    config: JSON.parse(JSON.stringify(currentConfig)),
  },
]

export async function GET() {
  return NextResponse.json({
    config: currentConfig,
    backups: backups.map(b => ({
      id: b.id,
      timestamp: b.timestamp,
      // Don't send full config in list — only on restore
    })),
  })
}

export async function POST(req: Request) {
  try {
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

    // Create backup of current config before saving
    const backup: ConfigBackup = {
      id: `bkp_${Date.now()}`,
      timestamp: new Date().toISOString(),
      config: JSON.parse(JSON.stringify(currentConfig)),
    }
    backups.unshift(backup)

    // Keep last 10 backups
    if (backups.length > 10) backups = backups.slice(0, 10)

    // Save new config
    currentConfig = config

    return NextResponse.json({
      success: true,
      config: currentConfig,
      backupId: backup.id,
      backups: backups.map(b => ({ id: b.id, timestamp: b.timestamp })),
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { backupId } = body

    if (!backupId) {
      return NextResponse.json({ error: 'Missing backupId' }, { status: 400 })
    }

    const backup = backups.find(b => b.id === backupId)
    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 })
    }

    // Save current as a new backup before restoring
    const preRestoreBackup: ConfigBackup = {
      id: `bkp_${Date.now()}`,
      timestamp: new Date().toISOString(),
      config: JSON.parse(JSON.stringify(currentConfig)),
    }
    backups.unshift(preRestoreBackup)
    if (backups.length > 10) backups = backups.slice(0, 10)

    // Restore
    currentConfig = JSON.parse(JSON.stringify(backup.config))

    return NextResponse.json({
      success: true,
      config: currentConfig,
      restoredFrom: backupId,
      backups: backups.map(b => ({ id: b.id, timestamp: b.timestamp })),
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
