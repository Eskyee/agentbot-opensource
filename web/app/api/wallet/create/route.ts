import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';

const CDP_PROJECT_ID = process.env.CDP_PROJECT_ID;
const CDP_API_KEY_NAME = process.env.CDP_API_KEY_NAME;
const CDP_API_KEY_PRIVATE_KEY = process.env.CDP_API_KEY_PRIVATE_KEY;

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    if (!CDP_PROJECT_ID) {
      return NextResponse.json({ 
        error: 'CDP not configured',
        setup: 'Set CDP_PROJECT_ID in environment' 
      }, { status: 500 });
    }

    const CdpClient = require('@coinbase/cdp-sdk').CdpClient;
    
    const client = new CdpClient({
      projectId: CDP_PROJECT_ID,
      name: CDP_API_KEY_NAME,
      privateKey: CDP_API_KEY_PRIVATE_KEY,
    });

    const result = await client.createWallet({
      networkIds: ['base-sepolia', 'base'],
    });

    return NextResponse.json({
      success: true,
      walletAddress: result.address,
      walletId: result.id,
      networks: result.networkIds,
    });
  } catch (error: any) {
    console.error('Wallet create error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create wallet',
      details: String(error)
    }, { status: 500 });
  }
}
