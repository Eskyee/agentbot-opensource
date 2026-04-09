import { prisma } from './app/lib/prisma';

async function test() {
  console.log('Testing Prisma usage log creation...');
  
  try {
    // Test creating a usage log directly
    const result = await prisma.usageLog.create({
      data: {
        userId: 'test-user',
        agentId: 'test-agent',
        model: 'test-model',
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.001,
        endpoint: '/test',
        success: true,
      },
    });
    
    console.log('✅ Usage log created:', result);
    
    // Count total
    const count = await prisma.usageLog.count();
    console.log(`Total usage logs: ${count}`);
    
  } catch (error) {
    console.error('❌ Failed to create usage log:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
