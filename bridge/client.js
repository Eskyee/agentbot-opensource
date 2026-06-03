#!/usr/bin/env node

/**
 * OpenClaw Bridge Client
 * Polls agentbot.sh for pending chat requests, forwards to local OpenClaw.
 *
 * Usage: BRIDGE_SECRET=*** OPENCLAW_CMD=openclaw node client.js
 */

const { execSync } = require('child_process')
const https = require('https')
const http = require('http')

const BRIDGE_URL = process.env.BRIDGE_URL || 'https://agentbot.sh'
const BRIDGE_SECRET = process.env["BRIDGE_SECRET"]
const OPENCLAW_CMD = process.env.OPENCLAW_CMD || 'openclaw'
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '3000', 10)

if (!BRIDGE_SECRET) {
  console.error('❌ BRIDGE_SECRET required.')
  process.exit(1)
}

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

function httpFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const client = parsed.protocol === 'https:' ? https : http
    const req = client.request(parsed, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 30000,
    }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    if (options.body) req.write(options.body)
    req.end()
  })
}

async function pollForRequests() {
  try {
    const res = await httpFetch(`${BRIDGE_URL}/api/bridge/poll?secret=${encodeURIComponent(BRIDGE_SECRET)}`)

    if (res.status !== 200) {
      log(`⚠️ Poll error: ${res.status}`)
      return
    }

    const data = JSON.parse(res.body)

    if (data.type === 'chat' && data.requestId) {
      log(`💬 Chat request: ${data.requestId}`)
      await handleChat(data)
    }
  } catch (err) {
    log(`❌ Poll error: ${err.message}`)
  }
}

async function handleChat(request) {
  const { requestId, messages } = request

  try {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()
    const message = lastUserMsg?.content || 'Hello'

    log(`📤 Sending to OpenClaw: "${message.slice(0, 50)}..."`)

    const result = execSync(
      `${OPENCLAW_CMD} agent --session-key bridge -m ${JSON.stringify(message)} --json --timeout 60`,
      {
        encoding: 'utf-8',
        timeout: 65000,
        env: { ...process.env, FORCE_COLOR: '0' },
      }
    )

    let response = ''
    try {
      const parsed = JSON.parse(result)
      response = parsed.reply || parsed.message || parsed.content || result.trim()
    } catch {
      response = result.trim() || 'No response from OpenClaw.'
    }

    await httpFetch(`${BRIDGE_URL}/api/bridge/poll?secret=${encodeURIComponent(BRIDGE_SECRET)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, content: response, done: true }),
    })

    log(`✅ Response sent: ${requestId} (${response.length} chars)`)
  } catch (err) {
    log(`❌ Chat error: ${err.message}`)

    await httpFetch(`${BRIDGE_URL}/api/bridge/poll?secret=${encodeURIComponent(BRIDGE_SECRET)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, content: `Error: ${err.message}`, done: true }),
    }).catch(() => {})
  }
}

async function main() {
  log('🦞 OpenClaw Bridge Client starting...')
  log(`   Bridge: ${BRIDGE_URL}`)
  log(`   OpenClaw: ${OPENCLAW_CMD} agent --session-key bridge`)
  log(`   Polling every ${POLL_INTERVAL}ms`)
  log('')

  while (true) {
    await pollForRequests()
    await new Promise(r => setTimeout(r, POLL_INTERVAL))
  }
}

process.on('SIGINT', () => { log('👋 Shutting down bridge...'); process.exit(0) })
process.on('SIGTERM', () => { process.exit(0) })

main()
