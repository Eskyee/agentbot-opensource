#!/usr/bin/env node

/**
 * OpenClaw Bridge Client
 *
 * Runs on your Mac mini. Polls agentbot.sh for pending chat requests,
 * forwards them to local OpenClaw, and posts responses back.
 *
 * Usage:
 *   BRIDGE_SECRET=<secret> OPENCLAW_TOKEN=<token> node client.js
 */

const http = require('http')
const https = require('https')

const BRIDGE_URL = process.env.BRIDGE_URL || 'https://agentbot.sh'
const BRIDGE_SECRET = process.env.BRIDGE_SECRET
const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://localhost:18789'
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '3000', 10)

if (!BRIDGE_SECRET) {
  console.error('❌ BRIDGE_SECRET required.')
  process.exit(1)
}

if (!OPENCLAW_TOKEN) {
  console.error('❌ OPENCLAW_TOKEN required. Get it from: openclaw gateway token')
  process.exit(1)
}

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

function fetch(url, options = {}) {
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
    const res = await fetch(`${BRIDGE_URL}/api/bridge/poll?secret=${encodeURIComponent(BRIDGE_SECRET)}`)

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
    const response = await callOpenClaw(messages)

    // Post response back to bridge
    await fetch(`${BRIDGE_URL}/api/bridge/poll?secret=${encodeURIComponent(BRIDGE_SECRET)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        content: response,
        done: true,
      }),
    })

    log(`✅ Response sent: ${requestId} (${response.length} chars)`)
  } catch (err) {
    log(`❌ Chat error: ${err.message}`)

    // Post error response
    await fetch(`${BRIDGE_URL}/api/bridge/poll?secret=${encodeURIComponent(BRIDGE_SECRET)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        content: `Error: ${err.message}`,
        done: true,
      }),
    }).catch(() => {})
  }
}

function callOpenClaw(messages) {
  return new Promise((resolve, reject) => {
    const url = new URL('/v1/chat/completions', OPENCLAW_URL)
    const isHttps = url.protocol === 'https:'
    const client = isHttps ? https : http

    const body = JSON.stringify({
      model: 'xiaomi-coding/mimo-v2.5-pro',
      messages,
      max_tokens: 2000,
    })

    const req = client.request({
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 60000,
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.message?.content || 'No response from OpenClaw.'
          resolve(content)
        } catch {
          resolve(data || 'Empty response from OpenClaw.')
        }
      })
    })

    req.on('error', (err) => reject(new Error(`OpenClaw connection failed: ${err.message}`)))
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('OpenClaw request timed out'))
    })

    req.write(body)
    req.end()
  })
}

// Main loop
async function main() {
  log('🦞 OpenClaw Bridge Client starting...')
  log(`   Bridge: ${BRIDGE_URL}`)
  log(`   OpenClaw: ${OPENCLAW_URL}`)
  log(`   Polling every ${POLL_INTERVAL}ms`)
  log('')

  while (true) {
    await pollForRequests()
    await new Promise(r => setTimeout(r, POLL_INTERVAL))
  }
}

process.on('SIGINT', () => {
  log('👋 Shutting down bridge...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  process.exit(0)
})

main()
