import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function getAgentUrl(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { openclawUrl: true, openclawInstanceId: true },
  })
  if (!user?.openclawInstanceId) return null
  return user.openclawUrl || `https://agentbot-agent-${user.openclawInstanceId}-production.up.railway.app`
}

export async function proxyGet(path: string) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agentUrl = await getAgentUrl(session.user.id)
  if (!agentUrl) {
    return NextResponse.json({ error: 'No agent deployed', status: 'no_agent' }, { status: 404 })
  }

  try {
    const res = await fetch(`${agentUrl}${path}`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`Agent returned ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Agent unreachable'
    return NextResponse.json({ error: message, status: 'unreachable' }, { status: 502 })
  }
}

export async function proxyPost(path: string, body: unknown) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agentUrl = await getAgentUrl(session.user.id)
  if (!agentUrl) {
    return NextResponse.json({ error: 'No agent deployed', status: 'no_agent' }, { status: 404 })
  }

  try {
    const res = await fetch(`${agentUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`Agent returned ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Agent unreachable'
    return NextResponse.json({ error: message, status: 'unreachable' }, { status: 502 })
  }
}
