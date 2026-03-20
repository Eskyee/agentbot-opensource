export const dynamic = "force-static"
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth'

function getAdminEmails(): string[] {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) return [];
  return adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export async function GET() {
  // Require admin authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const deployments = [
      {
        id: 'deploy-1',
        agentId: 'my-first-agent',
        name: 'My First Agent',
        status: 'active',
        createdAt: new Date(Date.now() - 300000).toISOString(),
        updatedAt: new Date(Date.now() - 60000).toISOString(),
        version: '1.0.0',
      },
      {
        id: 'deploy-2',
        agentId: 'fd90edcbecce95e2',
        name: 'fd90edcbecce95e2',
        status: 'active',
        createdAt: new Date(Date.now() - 180000).toISOString(),
        updatedAt: new Date(Date.now() - 120000).toISOString(),
        version: '1.0.0',
      },
      {
        id: 'deploy-3',
        agentId: '23104c045a71c730',
        name: '23104c045a71c730',
        status: 'active',
        createdAt: new Date(Date.now() - 120000).toISOString(),
        updatedAt: new Date(Date.now() - 90000).toISOString(),
        version: '1.0.0',
      },
      {
        id: 'deploy-4',
        agentId: 'fc2711220884ffe8',
        name: 'fc2711220884ffe8',
        status: 'active',
        createdAt: new Date(Date.now() - 60000).toISOString(),
        updatedAt: new Date(Date.now() - 30000).toISOString(),
        version: '1.0.0',
      },
    ]

    return NextResponse.json({
      deployments,
      total: deployments.length,
      status: 'ok',
    })
  } catch (error) {
    console.error('Failed to fetch deployments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deployments', deployments: [] },
      { status: 500 }
    )
  }
}
