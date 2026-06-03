#!/usr/bin/env node

const { spawnSync } = require('node:child_process')

const gatewayKey =
  process.env.OPENAI_API_KEY ||
  process.env.AI_GATEWAY_API_KEY ||
  process.env.VERCEL_AI_GATEWAY_KEY ||
  process.env.VERCEL_AI_GATEWAY_API_KEY

const env = {
  ...process.env,
  CLAUDE_CODE_USE_OPENAI: process.env.CLAUDE_CODE_USE_OPENAI || '1',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://ai-gateway.vercel.sh/v1',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'xiaomi/mimo-v2.5-pro',
}

if (gatewayKey) {
  env.OPENAI_API_KEY = gatewayKey
}

const result = spawnSync('openclaude', process.argv.slice(2), {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 0)
