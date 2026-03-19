import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { execSync } = require('child_process');
    
    const result = execSync('npx awal address --json 2>&1', { 
      encoding: 'utf8',
      timeout: 30000,
    });

    let address = result.trim();
    if (address.includes('not')) {
      return NextResponse.json({
        authenticated: false,
        needsAuth: true,
        message: 'Run: npx awal auth login your@email.com'
      });
    }

    return NextResponse.json({
      authenticated: true,
      address: address,
    });
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      needsAuth: true,
      error: String(error.stdout || error.message),
      setup: 'Install: npx skills add coinbase/agentic-wallet-skills'
    });
  }
}
