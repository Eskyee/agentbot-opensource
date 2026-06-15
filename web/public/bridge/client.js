#!/usr/bin/env node
/**
 * Agentbot Bridge Client
 * Polls agentbot.sh for pending requests, runs them through OpenClaw, and returns responses.
 *
 * Usage: node client.js
 * Requires: BRIDGE_SECRET, BRIDGE_URL env vars (or config.env in same dir)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Load config from config.env if it exists
const configPath = path.join(__dirname, 'config.env');
if (fs.existsSync(configPath)) {
  const lines = fs.readFileSync(configPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const BRIDGE_SECRET = process.env.BRIDGE_SECRET;
const BRIDGE_URL = process.env.BRIDGE_URL || 'https://agentbot.sh';
const OPENCLAW_CMD = process.env.OPENCLAW_CMD || 'openclaw';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '3000', 10);

if (!BRIDGE_SECRET) {
  console.error('❌ BRIDGE_SECRET is required. Set it in config.env or as an env var.');
  process.exit(1);
}

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 15000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: () => JSON.parse(data), text: () => data });
        } catch {
          resolve({ status: res.statusCode, json: () => ({ error: 'parse error' }), text: () => data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function poll() {
  const url = `${BRIDGE_URL}/api/bridge/poll?secret=${encodeURIComponent(BRIDGE_SECRET)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`[poll] Error: ${err.message}`);
    return null;
  }
}

async function respond(requestId, content, done = true) {
  const url = `${BRIDGE_URL}/api/bridge/poll?secret=${encodeURIComponent(BRIDGE_SECRET)}`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, content, done }),
    });
  } catch (err) {
    console.error(`[respond] Error: ${err.message}`);
  }
}

function runOpenClaw(messages) {
  // Build the prompt from messages
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');

  return new Promise((resolve) => {
    const child = spawn(OPENCLAW_CMD, ['run', '--message', prompt], {
      timeout: 120000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });

    child.on('close', (code) => {
      resolve(stdout.trim() || `Bridge error (exit ${code}): ${stderr.trim()}`);
    });

    child.on('error', (err) => {
      resolve(`Bridge error: ${err.message}`);
    });
  });
}

let running = false;

async function loop() {
  if (running) return;
  running = true;

  try {
    const data = await poll();
    if (!data || data.type === 'idle') {
      running = false;
      return;
    }

    if (data.type === 'chat' && data.requestId) {
      console.log(`[bridge] Received request ${data.requestId} with ${data.messages.length} messages`);

      // Run OpenClaw asynchronously
      const response = await runOpenClaw(data.messages);
      console.log(`[bridge] Response length: ${response.length} chars`);

      await respond(data.requestId, response, true);
      console.log(`[bridge] Response sent for ${data.requestId}`);
    }
  } catch (err) {
    console.error(`[bridge] Loop error: ${err.message}`);
  } finally {
    running = false;
  }
}

console.log('🦞 Agentbot Bridge Client');
console.log(`   Server: ${BRIDGE_URL}`);
console.log(`   Poll interval: ${POLL_INTERVAL}ms`);
console.log('');

setInterval(loop, POLL_INTERVAL);
loop(); // Initial poll
