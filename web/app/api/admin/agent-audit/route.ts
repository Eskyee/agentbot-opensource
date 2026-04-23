import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getAuthSession } from '@/app/lib/getAuthSession';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch from Prisma singular table
    const prismaAgents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        websocketUrl: true,
        config: true,
      },
    });

    // 2. Fetch from Backend plural table (raw SQL)
    const backendAgents = await prisma.$queryRaw<any[]>`SELECT * FROM agents`.catch(() => []);
    
    // 3. Fetch from Wallets table (to find the $3)
    const wallets = await prisma.$queryRaw<any[]>`SELECT * FROM wallets WHERE balance_usdc > 0 OR balance_usdc IS NOT NULL`.catch(() => []);

    return NextResponse.json({ 
      prismaAgents, 
      backendAgents, 
      wallets,
      message: "Deep audit complete. Check 'wallets' for the missing $3."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
