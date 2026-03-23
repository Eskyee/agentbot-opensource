import { NextResponse } from 'next/server';
import { logUsage } from '@/lib/usage-logger';

export async function POST() {
  console.log('[TestUsage] Testing usage logger...');
  
  try {
    logUsage({
      userId: 'test',
      agentId: 'test-agent',
      model: 'test-model',
      inputTokens: 100,
      outputTokens: 50,
      endpoint: '/api/test-usage',
      success: true,
    });
    
    console.log('[TestUsage] logUsage called successfully');
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Usage logger called',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[TestUsage] Error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: (error as Error).message 
    }, { status: 500 });
  }
}
