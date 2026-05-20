import { execSync, spawn } from 'child_process'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import express from 'express'

const app = express()
app.use(express.json())

const RELAY_PORT = Number(process.env.RELAY_PORT || 8090)
const NGINX_RTMP_PORT = Number(process.env.NGINX_RTMP_PORT || 1935)
const NGINX_HTTP_PORT = Number(process.env.NGINX_HTTP_PORT || 8080)
const BASEFM_API = process.env.BASEFM_API || 'https://agentbot.sh'
const RELAY_SECRET = process.env.RELAY_SECRET || ''
const PUSH_CONF = '/etc/nginx/conf.d/push.conf'

// Track active relay processes per stream key
// key = streamKey, value = { ffmpeg: ChildProcess, destinations: [...], startedAt }
const activeRelays = new Map()

// ─── Relay Destinations ────────────────────────────────────────────
// Stored in-memory + persisted to /data/relay-destinations.json
const DATA_DIR = '/data'
const DEST_FILE = `${DATA_DIR}/relay-destinations.json`

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

let destinations = loadDestinations()

function loadDestinations() {
  try {
    if (existsSync(DEST_FILE)) {
      return JSON.parse(readFileSync(DEST_FILE, 'utf-8'))
    }
  } catch {}
  // Default: Mux is always the primary (per-DJ key), X is optional shared
  return [
    {
      id: 'mux-primary',
      name: 'Mux (baseFM)',
      type: 'mux',
      rtmpUrl: 'rtmp://global-live.mux.com:5222/app',
      enabled: true,
      required: true,
      perUser: true, // uses per-DJ stream key from database
      streamKey: '', // not used directly — per-DJ key injected at relay time
    },
  ]
}

function saveDestinations() {
  try {
    writeFileSync(DEST_FILE, JSON.stringify(destinations, null, 2))
  } catch (e) {
    console.error('[relay] Failed to save destinations:', e.message)
  }
}

// ─── Stream Key Auth (called by nginx on_publish) ──────────────────
// nginx sends: name=<stream_key>&app=live&addr=...
// We validate against the Agentbot backend and return a per-DJ Mux key
app.get('/auth/publish', async (req, res) => {
  const streamKey = req.query.name
  if (!streamKey) return res.status(403).send('Missing stream key')

  try {
    // Validate with Agentbot backend
    const authRes = await fetch(`${BASEFM_API}/api/relay/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(RELAY_SECRET ? { 'X-Relay-Secret': RELAY_SECRET } : {}),
      },
      body: JSON.stringify({ streamKey }),
    })

    if (!authRes.ok) {
      console.warn(`[relay] Auth rejected for key ${streamKey.slice(0, 8)}...`)
      return res.status(403).send('Unauthorized')
    }

    const auth = await authRes.json()
    const djName = auth.djName || 'Unknown DJ'

    // Spawn ffmpeg relay processes for this stream
    startRelay(streamKey, auth)

    console.log(`[relay] ✅ ${djName} connected — relaying to ${getActiveDestinationCount()} destinations`)
    return res.status(200).send('OK')
  } catch (e) {
    console.error('[relay] Auth error:', e.message)
    return res.status(500).send('Auth error')
  }
})

app.get('/auth/publish_done', (req, res) => {
  const streamKey = req.query.name
  if (streamKey) {
    stopRelay(streamKey)
    console.log(`[relay] ⏹ Stream ended: ${streamKey.slice(0, 8)}...`)
  }
  return res.status(200).send('OK')
})

// ─── Relay Management API ──────────────────────────────────────────

// List all relay destinations
app.get('/relay/destinations', (_req, res) => {
  res.json({ destinations })
})

// Add or update a relay destination
app.put('/relay/destinations/:id', (req, res) => {
  const { id } = req.params
  const body = req.body
  const idx = destinations.findIndex((d) => d.id === id)
  const dest = {
    id,
    name: body.name || id,
    type: body.type || 'custom',
    rtmpUrl: body.rtmpUrl || '',
    streamKey: body.streamKey || '',
    enabled: body.enabled !== false,
    required: Boolean(body.required),
    perUser: Boolean(body.perUser),
  }

  if (idx >= 0) {
    destinations[idx] = dest
  } else {
    destinations.push(dest)
  }

  saveDestinations()
  res.json({ destination: dest })
})

// Remove a relay destination
app.delete('/relay/destinations/:id', (req, res) => {
  const { id } = req.params
  const dest = destinations.find((d) => d.id === id)
  if (dest?.required) {
    return res.status(400).json({ error: 'Cannot remove required destination' })
  }
  destinations = destinations.filter((d) => d.id !== id)
  saveDestinations()
  res.json({ ok: true })
})

// List active streams
app.get('/relay/streams', (_req, res) => {
  const streams = []
  for (const [key, relay] of activeRelays) {
    streams.push({
      streamKey: key.slice(0, 8) + '...',
      djName: relay.djName,
      startedAt: relay.startedAt,
      destinations: relay.destinations.map((d) => ({
        name: d.name,
        type: d.type,
        pid: d.process?.pid || null,
      })),
    })
  }
  res.json({ streams })
})

// Health
app.get('/relay/health', (_req, res) => {
  res.json({
    status: 'ok',
    activeStreams: activeRelays.size,
    destinations: destinations.length,
    uptime: process.uptime(),
  })
})

// Update a relay destination's stream key (for setting X/YouTube keys)
app.patch('/relay/destinations/:id/key', (req, res) => {
  const { id } = req.params
  const { streamKey } = req.body
  const dest = destinations.find((d) => d.id === id)
  if (!dest) return res.status(404).json({ error: 'Destination not found' })
  dest.streamKey = streamKey || ''
  saveDestinations()
  res.json({ ok: true })
})

// ─── ffmpeg Relay Spawning ──────────────────────────────────────────

function getActiveDestinationCount() {
  return destinations.filter((d) => d.enabled && d.rtmpUrl).length
}

function startRelay(streamKey, auth) {
  const procs = []
  const rtmpInput = `rtmp://127.0.0.1:${NGINX_RTMP_PORT}/live/${streamKey}`

  for (const dest of destinations) {
    if (!dest.enabled || !dest.rtmpUrl) continue
    // Mux uses per-DJ key from auth, others use their stored key
    const key = dest.perUser ? (auth.muxStreamKey || streamKey) : (dest.streamKey || streamKey)
    const outputUrl = `${dest.rtmpUrl}/${key}`

    try {
      const ffmpeg = spawn('ffmpeg', [
        '-i', rtmpInput,
        '-c', 'copy',           // no re-encode — pass-through
        '-f', 'flv',
        '-y',
        outputUrl,
      ], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      })

      ffmpeg.stderr.on('data', (chunk) => {
        const line = chunk.toString().trim()
        if (line.includes('error') || line.includes('Error')) {
          console.error(`[ffmpeg:${dest.id}] ${line}`)
        }
      })

      ffmpeg.on('exit', (code) => {
        if (code && code !== 0 && code !== 255) {
          console.warn(`[ffmpeg:${dest.id}] exited with code ${code}`)
        }
      })

      procs.push({ name: dest.name, type: dest.type, process: ffmpeg })
      console.log(`[relay] → ${dest.name}: ${dest.rtmpUrl} (pid ${ffmpeg.pid})`)
    } catch (e) {
      console.error(`[relay] Failed to start ${dest.id}:`, e.message)
    }
  }

  activeRelays.set(streamKey, {
    djName: auth.djName || 'Unknown',
    startedAt: new Date().toISOString(),
    destinations: procs,
  })
}

function stopRelay(streamKey) {
  const relay = activeRelays.get(streamKey)
  if (!relay) return

  for (const dest of relay.destinations) {
    try {
      dest.process.kill('SIGTERM')
    } catch {}
  }

  activeRelays.delete(streamKey)
}

// ─── Graceful Shutdown ──────────────────────────────────────────────

function shutdown() {
  console.log('[relay] Shutting down...')
  for (const [key, relay] of activeRelays) {
    for (const dest of relay.destinations) {
      try { dest.process.kill('SIGTERM') } catch {}
    }
  }
  activeRelays.clear()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// ─── Start ──────────────────────────────────────────────────────────

app.listen(RELAY_PORT, '0.0.0.0', () => {
  console.log(`[relay] Management API on :${RELAY_PORT}`)
  console.log(`[relay] nginx-rtmp ingest on :${NGINX_RTMP_PORT}`)
  console.log(`[relay] ${destinations.length} relay destinations configured`)
  for (const dest of destinations) {
    if (dest.enabled && dest.rtmpUrl) {
      console.log(`[relay]   → ${dest.name}: ${dest.rtmpUrl} (${dest.perUser ? 'per-DJ key' : 'shared key'})`)
    }
  }
})
