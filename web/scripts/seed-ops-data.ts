import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateDID(agentId: string): { did: string; publicKey: string } {
  const seed = `${agentId}:${Date.now()}:${Math.random().toString(36).slice(2)}`
  const hash = createHash('sha256').update(seed).digest('base64url')
  return {
    did: `did:key:z6Mk${hash.slice(0, 44)}`,
    publicKey: hash,
  }
}

const EXECUTION_TYPES = ['prompt', 'skill', 'workflow', 'sync', 'chat', 'tool', 'cron']
const MODELS = ['mimo-v2-pro', 'mimo-v2.5-pro', 'gpt-4o', 'claude-3.5-sonnet', 'blockrun/auto']

async function main() {
  console.log('🌱 Seeding ops data...\n')

  // 1. Fetch all agents
  const agents = await prisma.agent.findMany({
    select: { id: true, name: true, userId: true, config: true, status: true },
  })

  if (agents.length === 0) {
    console.log('No agents found. Nothing to seed.')
    return
  }

  console.log(`Found ${agents.length} agents`)

  // 2. Generate DIDs for all agents
  console.log('\n🔑 Generating DIDs...')
  for (const agent of agents) {
    const { did, publicKey } = generateDID(agent.id)
    const existingConfig = (agent.config as Record<string, unknown>) || {}
    const updatedConfig = {
      ...existingConfig,
      did,
      publicKey,
      keyAlgorithm: 'ed25519',
      didCreatedAt: new Date().toISOString(),
    }

    await prisma.agent.update({
      where: { id: agent.id },
      data: { config: updatedConfig },
    })
    console.log(`  ✓ ${agent.name} → ${did.slice(0, 30)}...`)
  }

  // 3. Seed container_metrics (spread over 24h)
  console.log('\n📊 Seeding container_metrics...')
  const now = Date.now()
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000
  const sampleInterval = 15 * 60 * 1000 // every 15 minutes
  const sampleCount = Math.floor((now - twentyFourHoursAgo) / sampleInterval)

  let metricsInserted = 0
  for (const agent of agents) {
    // Different profiles per agent
    const isActive = agent.status === 'running' || agent.status === 'active'
    const baseCpu = isActive ? randomBetween(25, 55) : randomBetween(5, 20)
    const baseMem = isActive ? randomBetween(35, 65) : randomBetween(20, 40)

    const metricData: Array<{
      user_id: string
      container_name: string
      cpu_percent: number
      mem_percent: number
      message_count: number
      error_count: number
      sampled_at: Date
    }> = []

    for (let i = 0; i < sampleCount; i++) {
      const sampledAt = new Date(twentyFourHoursAgo + i * sampleInterval)
      // Add some variance — simulate real CPU/mem fluctuation
      const hourOfDay = sampledAt.getUTCHours()
      const activityMultiplier = hourOfDay >= 9 && hourOfDay <= 22 ? 1.3 : 0.7

      const cpu = Math.min(95, Math.max(2, baseCpu * activityMultiplier + randomBetween(-15, 15)))
      const mem = Math.min(90, Math.max(10, baseMem + randomBetween(-10, 10)))

      metricData.push({
        user_id: agent.userId,
        container_name: agent.name,
        cpu_percent: Math.round(cpu * 100) / 100,
        mem_percent: Math.round(mem * 100) / 100,
        message_count: isActive ? randomInt(0, 20) : randomInt(0, 3),
        error_count: Math.random() < 0.05 ? randomInt(1, 3) : 0,
        sampled_at: sampledAt,
      })
    }

    // Batch insert in chunks of 100
    for (let i = 0; i < metricData.length; i += 100) {
      const chunk = metricData.slice(i, i + 100)
      await prisma.container_metrics.createMany({ data: chunk })
      metricsInserted += chunk.length
    }
    console.log(`  ✓ ${agent.name}: ${metricData.length} samples`)
  }
  console.log(`  Total: ${metricsInserted} metrics`)

  // 4. Seed execution_logs
  console.log('\n📋 Seeding execution_logs...')
  let logsInserted = 0
  for (const agent of agents) {
    const isActive = agent.status === 'running' || agent.status === 'active'
    const logCount = isActive ? randomInt(30, 80) : randomInt(5, 20)

    const logData: Array<{
      user_id: string
      agent_id: string
      execution_type: string
      success: boolean
      error_message: string | null
      duration_ms: number
      created_at: Date
    }> = []

    for (let i = 0; i < logCount; i++) {
      const createdAt = new Date(
        twentyFourHoursAgo + Math.random() * (now - twentyFourHoursAgo)
      )
      const success = Math.random() > 0.12 // ~88% success rate
      const executionType = randomChoice(EXECUTION_TYPES)
      const durationMs = executionType === 'workflow'
        ? randomInt(500, 3000)
        : executionType === 'prompt'
          ? randomInt(100, 1500)
          : randomInt(50, 800)

      logData.push({
        user_id: agent.userId,
        agent_id: agent.id,
        execution_type: executionType,
        success,
        error_message: success
          ? null
          : randomChoice([
              'Timeout: model did not respond within 30s',
              'Rate limit exceeded (429)',
              'Tool execution failed: connection refused',
              'Workflow step 3 failed: invalid schema',
              'Auth token expired during execution',
            ]),
        duration_ms: durationMs,
        created_at: createdAt,
      })
    }

    // Sort by date for realistic ordering
    logData.sort((a, b) => a.created_at.getTime() - b.created_at.getTime())

    await prisma.execution_logs.createMany({ data: logData })
    logsInserted += logData.length
    console.log(`  ✓ ${agent.name}: ${logData.length} runs (${logData.filter(l => !l.success).length} failed)`)
  }
  console.log(`  Total: ${logsInserted} execution logs`)

  // 5. Seed model_metrics
  console.log('\n💰 Seeding model_metrics...')
  let modelInserted = 0
  for (const agent of agents) {
    const isActive = agent.status === 'running' || agent.status === 'active'
    const entryCount = isActive ? randomInt(20, 60) : randomInt(3, 10)

    const modelData: Array<{
      user_id: number | null
      agent_id: number | null
      model: string
      input_tokens: number
      output_tokens: number
      cost_usdc: number
      created_at: Date
    }> = []

    // model_metrics uses Int? for user_id and agent_id (legacy table)
    // We need to find the corresponding legacy user/agent IDs
    // Since model_metrics.user_id is Int?, we need a numeric user ID
    // Let's check if there's a matching users table entry
    const legacyUser = await prisma.users.findFirst({
      where: { email: { not: '' } },
      select: { id: true },
    })

    for (let i = 0; i < entryCount; i++) {
      const createdAt = new Date(
        twentyFourHoursAgo + Math.random() * (now - twentyFourHoursAgo)
      )
      const model = randomChoice(MODELS)
      const inputTokens = randomInt(200, 8000)
      const outputTokens = randomInt(100, 4000)

      // Cost estimation: ~$0.002 per 1K input tokens, ~$0.01 per 1K output tokens
      const costUsdc = (inputTokens / 1000) * 0.002 + (outputTokens / 1000) * 0.01

      modelData.push({
        user_id: legacyUser?.id ?? null,
        agent_id: null, // Legacy agents use Int IDs — we'd need to map; leave null for now
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usdc: Math.round(costUsdc * 1000000) / 1000000,
        created_at: createdAt,
      })
    }

    modelData.sort((a, b) => a.created_at.getTime() - b.created_at.getTime())

    await prisma.model_metrics.createMany({ data: modelData })
    modelInserted += modelData.length
    console.log(`  ✓ ${agent.name}: ${modelData.length} model entries`)
  }
  console.log(`  Total: ${modelInserted} model metrics`)

  // 6. Summary
  console.log('\n✅ Seed complete!')
  console.log(`  Agents updated with DIDs: ${agents.length}`)
  console.log(`  Container metrics: ${metricsInserted}`)
  console.log(`  Execution logs: ${logsInserted}`)
  console.log(`  Model metrics: ${modelInserted}`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
