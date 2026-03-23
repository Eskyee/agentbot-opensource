const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  
  console.log('Testing cost API logic...');
  console.log('Since:', since);
  
  try {
    const logs = await prisma.usageLog.findMany({
      where: {
        createdAt: { gte: since },
      },
      select: {
        agentId: true,
        model: true,
        inputTokens: true,
        outputTokens: true,
        costUsd: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`Found ${logs.length} logs`);
    
    if (logs.length > 0) {
      console.log('First log:', logs[0]);
      
      // Aggregate by agent
      const agentMap = new Map();
      for (const row of logs) {
        const tokens = (row.inputTokens || 0) + (row.outputTokens || 0);
        const cost = parseFloat(String(row.costUsd || 0));
        
        const agent = agentMap.get(row.agentId) || { tokens: 0, cost: 0, calls: 0, model: row.model };
        agent.tokens += tokens;
        agent.cost += cost;
        agent.calls += 1;
        agentMap.set(row.agentId, agent);
      }
      
      const agents = Array.from(agentMap.entries()).map(([name, data]) => ({
        name,
        tokens: data.tokens,
        cost: parseFloat(data.cost.toFixed(2)),
        calls: data.calls,
        avgCostPerCall: parseFloat((data.cost / Math.max(data.calls, 1)).toFixed(4)),
        model: data.model,
      }));
      
      console.log('Agents:', agents);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
