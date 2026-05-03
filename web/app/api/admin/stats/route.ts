import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getInternalApiKey, getBackendApiUrl } from '@/app/api/lib/api-keys';
import { prisma } from '@/app/lib/prisma';


function getAdminEmails(): string[] {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) return [];
  return adminEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();

    // Use ADMIN_EMAILS env var — role field is not exposed in JWT/session
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const BACKEND_API_URL = getBackendApiUrl();
    const INTERNAL_API_KEY = getInternalApiKey();

    let backendStatus = 'DOWN'
    let instances: any[] = []
    let instanceCount = 0
    
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/openclaw/instances`, {
        headers: {
          Authorization: `Bearer ${INTERNAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = await response.json()
        instances = data.instances || []
        instanceCount = data.count || 0
        backendStatus = 'OK'
      } else {
        // Backend is reachable but instances endpoint fails — still mark as OK
        backendStatus = 'OK'
      }
    } catch {
      // Backend unreachable — check health endpoint as fallback
      try {
        const healthRes = await fetch(`${BACKEND_API_URL}/health`, { signal: AbortSignal.timeout(3000) })
        if (healthRes.ok) backendStatus = 'OK'
      } catch {}
    }

    const [prismaUserCount, prismaAgentCount] = await Promise.all([
      prisma.user.count(),
      prisma.agent.count(),
    ])

    return NextResponse.json({
      instances,
      count: instanceCount,
      userBase: prismaUserCount,
      totalAgents: prismaAgentCount,
      backendStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Admin stats fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform stats', instances: [], count: 0 },
      { status: 500 }
    )
  }
}
