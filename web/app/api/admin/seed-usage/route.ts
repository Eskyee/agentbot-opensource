import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  
  // Simple auth
  if (secret !== process.env.ADMIN_SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminId = 'cmojb6v3h000024cnwz8ldrst';
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const logs = [];

    // 200 admin requests this month
    for (let i = 0; i < 200; i++) {
      const model = Math.random() > 0.3 ? 'mimo-v2.5-pro' : 'mimo-v2.5';
      const inputTokens = Math.floor(Math.random() * 8000) + 500;
      const outputTokens = Math.floor(Math.random() * 3000) + 200;
      const daysAgo = Math.floor(Math.random() * 5);
      logs.push({
        user_id: adminId,
        agent_id: 'atlas',
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        created_at: new Date(monthStart.getTime() + daysAgo * 86400000 + Math.random() * 86400000),
      });
    }

    // 50 demo/proxy requests
    for (let i = 0; i < 50; i++) {
      const inputTokens = Math.floor(Math.random() * 5000) + 1000;
      const outputTokens = Math.floor(Math.random() * 2000) + 500;
      const daysAgo = Math.floor(Math.random() * 5);
      logs.push({
        user_id: i % 2 === 0 ? 'demo' : 'proxy',
        agent_id: 'agent',
        model: 'mimo-v2.5-pro',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        created_at: new Date(monthStart.getTime() + daysAgo * 86400000 + Math.random() * 86400000),
      });
    }

    await prisma.usage_logs.createMany({ data: logs });
    const count = await prisma.usage_logs.count();
    
    return NextResponse.json({ 
      success: true, 
      created: logs.length, 
      total: count 
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
