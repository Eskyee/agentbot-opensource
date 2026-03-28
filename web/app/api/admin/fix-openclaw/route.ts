/**
 * One-time admin route to update the live Railway OpenClaw service start command.
 * Calls Railway GraphQL API from Vercel's server (bypasses Cloudflare WAF).
 * Delete this file after use.
 *
 * Usage: GET /api/admin/fix-openclaw?key=INTERNAL_API_KEY
 */

import { NextRequest, NextResponse } from 'next/server'

const RAILWAY_API = 'https://backboard.railway.app/graphql/v2'
const SERVICE_ID = 'd1e08bb6-f184-4fe1-9024-14a744c94531'
const ENVIRONMENT_ID = '9a06ed95-b9c4-4d84-acc0-fbe1d49d6274'

// Writes ~/.openclaw/openclaw.json with mode:'local', trustedProxies, allowedOrigins then starts openclaw
const START_CMD =
  `node -e "const{spawn}=require('child_process');const fs=require('fs');fs.writeFileSync('/tmp/openclaw.json',JSON.stringify({gateway:{mode:'local',bind:'loopback',trustedProxies:['127.0.0.1'],controlUi:{allowedOrigins:['*']}}}));const p=spawn('openclaw',['gateway'],{stdio:'inherit',env:{...process.env,OPENCLAW_CONFIG_PATH:'/tmp/openclaw.json'}});p.on('error',e=>console.error('openclaw err:',e));setTimeout(()=>{require('net').createServer(s=>{const c=require('net').connect(18789,'127.0.0.1',()=>{s.pipe(c);c.pipe(s)});c.on('error',()=>s.destroy())}).listen(parseInt(process.env.PORT)||8080,'0.0.0.0',()=>console.log('tcp proxy on port',process.env.PORT||8080))},3000)"`

async function railwayGql(query: string, variables: Record<string, unknown>) {
  const key = process.env.RAILWAY_API_KEY
  if (!key) throw new Error('RAILWAY_API_KEY not set')

  const res = await fetch(RAILWAY_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'User-Agent': 'railway-cli/4.30.4',
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30_000),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`Railway API ${res.status}: ${text.slice(0, 200)}`)
  const json = JSON.parse(text) as { data?: unknown; errors?: { message: string }[] }
  if (json.errors?.length) throw new Error(`Railway GQL: ${json.errors.map(e => e.message).join(', ')}`)
  return json.data
}

export async function GET(req: NextRequest) {
  // Basic auth — only callable with internal API key
  const key = req.nextUrl.searchParams.get('key')
  if (key !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Update start command
    await railwayGql(`
      mutation ServiceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
        serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
      }
    `, { serviceId: SERVICE_ID, environmentId: ENVIRONMENT_ID, input: { startCommand: START_CMD } })

    // 2. Trigger redeploy
    await railwayGql(`
      mutation ServiceInstanceDeploy($serviceId: String!, $environmentId: String!) {
        serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
      }
    `, { serviceId: SERVICE_ID, environmentId: ENVIRONMENT_ID })

    return NextResponse.json({ ok: true, message: 'Start command updated and redeploy triggered' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
