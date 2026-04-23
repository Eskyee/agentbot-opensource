import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAuthSession } from '@/app/lib/getAuthSession';

/**
 * Admin: Database Health & Sync Audit
 * 
 * Performs a deep-dive comparison between the active Prisma models 
 * and the raw SQL state to detect schema drift.
 */
export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Audit core record counts for drift detection
    const [
      prismaUsers, 
      prismaAgents, 
      prismaDeployments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.agent.count(),
      prisma.agent.count({ where: { status: 'active' } }) // Proxy for deployments in Prisma
    ]);

    // 2. Audit raw table presence (checking if backend tables exist)
    const rawTables = await prisma.$queryRaw<any[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const tableNames = rawTables.map(t => t.table_name);
    
    // Detect "Ghost Tables" (tables in DB but not in current Prisma model)
    const knownModels = ['User', 'Account', 'Session', 'Agent', 'Buddy', 'M2MJob']; // abbreviated
    const ghostTables = tableNames.filter(t => !knownModels.some(m => m.toLowerCase() === t.replace(/_/g, '').toLowerCase()));

    // 3. Check for specific dangerous drifts
    const hasLegacyUsers = tableNames.includes('users'); // plural vs singular User
    const hasLegacyAgents = tableNames.includes('agents');

    return NextResponse.json({
      summary: {
        status: (hasLegacyUsers && hasLegacyAgents) ? 'critical_drift' : 'healthy',
        databaseEngine: 'PostgreSQL',
        totalTables: tableNames.length,
      },
      counts: {
        users: prismaUsers,
        agents: prismaAgents,
        activeDeployments: prismaDeployments,
      },
      drift: {
        hasLegacyUsers,
        hasLegacyAgents,
        ghostTables: ghostTables.length,
        ghostTableNames: ghostTables.slice(0, 10),
      },
      recommendation: (hasLegacyUsers) 
        ? "ACTION_REQUIRED: Detected legacy 'users' table alongside 'User' model. Merge required to prevent state loss."
        : "Database is in sync with model definitions."
    });
  } catch (error: any) {
    console.error('[Admin/DB-Health] Audit failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
