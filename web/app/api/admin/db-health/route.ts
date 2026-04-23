import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { isAdminEmail } from '@/app/lib/admin';

/**
 * Admin: Database Health & Sync Audit
 * 
 * Performs a deep-dive comparison between the active Prisma models 
 * and the raw SQL state to detect schema drift.
 */
export async function GET() {
  const session = await getAuthSession();
  const isAdmin = session?.user?.isAdmin || isAdminEmail(session?.user?.email);
  
  if (!isAdmin) {
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
    const knownModels = ['User', 'Account', 'Session', 'Agent', 'Buddy', 'M2MJob']; 
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

/**
 * POST /api/admin/db-health
 * Performs "FORCE_GLOBAL_SYNC"
 * 
 * Strategy:
 * 1. Find users in "User" (singular) and UPSERT into "users" (plural).
 * 2. Find agents in "Agent" (singular) and UPSERT into "agents" (plural).
 * 3. This allows the backend to see data created by the frontend.
 */
export async function POST() {
  const session = await getAuthSession();
  const isAdmin = session?.user?.isAdmin || isAdminEmail(session?.user?.email);

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Admin/Sync] Starting Global Infrastructure Reconciliation...');

  try {
    // 1. Fetch all users from Prisma
    const prismaUsers = await prisma.user.findMany();
    let usersSynced = 0;

    for (const u of prismaUsers) {
      // Upsert into plural 'users' table
      await prisma.$executeRaw`
        INSERT INTO users (email, plan, stripe_subscription_id, created_at, updated_at)
        VALUES (${u.email}, ${u.plan || 'solo'}, ${u.stripeSubscriptionId || null}, ${u.createdAt}, ${u.updatedAt})
        ON CONFLICT (email) DO UPDATE SET
          plan = EXCLUDED.plan,
          stripe_subscription_id = EXCLUDED.stripe_subscription_id,
          updated_at = NOW()
      `;
      usersSynced++;
    }

    // 2. Fetch all agents from Prisma
    const prismaAgents = await prisma.agent.findMany({
      include: { user: true }
    });
    let agentsSynced = 0;

    for (const a of prismaAgents) {
      // Use the email from the joined user object
      const email = a.user?.email || '';
      if (!email) continue;

      // Find the user ID in the plural table to maintain relations
      const uResult = await prisma.$queryRaw<any[]>`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
      const backendUserId = uResult[0]?.id;

      if (backendUserId) {
        // We use $executeRaw with manual mapping because the IDs might differ
        // between the primary key styles.
        await prisma.$executeRaw`
          INSERT INTO agents (user_id, name, status, config, created_at, updated_at)
          VALUES (${backendUserId}, ${a.name}, ${a.status}, ${a.config as any || {}}, ${a.createdAt}, ${a.updatedAt})
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            config = EXCLUDED.config,
            updated_at = NOW()
        `;
        agentsSynced++;
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        usersSynced,
        agentsSynced
      },
      message: "Reconciliation complete. Backend and Frontend are now synchronized."
    });

  } catch (error: any) {
    console.error('[Admin/Sync] Reconciliation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
