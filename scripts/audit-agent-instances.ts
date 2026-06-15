/**
 * Agent Instance Audit & Repair
 * 
 * Checks all user agent instances, verifies Railway domains,
 * and repairs broken URL mappings.
 * 
 * Usage: npx tsx scripts/audit-agent-instances.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const RAILWAY_API = 'https://backboard.railway.app/graphql/v2'

async function railwayGql(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(RAILWAY_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RAILWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json() as any
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data
}

async function getServiceDomain(serviceId: string): Promise<string | null> {
  try {
    const data = await railwayGql(`
      query GetService($serviceId: String!) {
        service(id: $serviceId) {
          domains {
            edges {
              node {
                domain
                targetPort
              }
            }
          }
        }
      }
    `, { serviceId })
    
    const domains = data?.service?.domains?.edges || []
    // Return first domain with port 18789 (agent gateway)
    for (const edge of domains) {
      if (edge.node.targetPort === 18789) {
        return edge.node.domain
      }
    }
    // Fallback to first domain
    return domains[0]?.node?.domain || null
  } catch {
    return null
  }
}

async function checkHealth(url: string): Promise<{ ok: boolean; status: number; body: string }> {
  try {
    const res = await fetch(`${url}/health`, { 
      signal: AbortSignal.timeout(10000) 
    })
    const body = await res.text()
    return { ok: res.ok, status: res.status, body }
  } catch (err: any) {
    return { ok: false, status: 0, body: err.message }
  }
}

async function main() {
  console.log('🔍 Agent Instance Audit')
  console.log('========================\n')

  // Get all users with agent instances
  const users = await prisma.user.findMany({
    where: {
      openclawUrl: { not: null },
    },
    select: {
      id: true,
      email: true,
      plan: true,
      openclawUrl: true,
      openclawInstanceId: true,
    },
  })

  console.log(`Found ${users.length} users with agent instances\n`)

  const results = {
    healthy: 0,
    broken: 0,
    repaired: 0,
    dead: 0,
    needReprovision: 0,
  }

  for (const user of users) {
    const url = user.openclawUrl
    if (!url) continue

    console.log(`\n📦 User: ${user.email || user.id} (plan: ${user.plan})`)
    console.log(`   URL: ${url}`)
    console.log(`   Instance: ${user.openclawInstanceId}`)

    // Check current health
    const health = await checkHealth(url)
    
    if (health.ok) {
      console.log(`   ✅ Healthy — ${health.body.slice(0, 80)}`)
      results.healthy++
      continue
    }

    console.log(`   ❌ DOWN — ${health.status}: ${health.body.slice(0, 80)}`)
    results.broken++

    // Try to find the correct domain via Railway API
    const serviceName = `agentbot-agent-${user.id}`
    console.log(`   🔎 Looking up Railway service: ${serviceName}`)

    // Try alternate URL patterns
    const alternateUrls = [
      url.replace(/-production\./, '-production-2286.'),
      url.replace(/-production\./, '-production-ad37.'),
    ]

    for (const altUrl of alternateUrls) {
      if (altUrl === url) continue
      console.log(`   🔎 Trying: ${altUrl}`)
      const altHealth = await checkHealth(altUrl)
      if (altHealth.ok) {
        console.log(`   ✅ Found alive at: ${altUrl}`)
        await prisma.user.update({
          where: { id: user.id },
          data: { openclawUrl: altUrl },
        })
        console.log(`   💾 Updated URL in database`)
        results.repaired++
        results.broken--
        break
      }
    }
  }

  console.log('\n========================')
  console.log(`📊 Results:`)
  console.log(`   ✅ Healthy: ${results.healthy}`)
  console.log(`   ❌ Broken: ${results.broken}`)
  console.log(`   🔧 Repaired: ${results.repaired}`)
  console.log(`   💀 Dead: ${results.dead}`)
  console.log(`   🔄 Need Reprovision: ${results.needReprovision}`)
  console.log('========================\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
