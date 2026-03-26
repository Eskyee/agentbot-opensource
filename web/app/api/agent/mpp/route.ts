import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession'
import {
  createAgentWallet,
  getAgentMPPWallets,
  getAgentWalletAddress,
  registerAgentWallet,
  getAgentBalance,
  makeMPPRequest,
} from '@/lib/mpp';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authSession = await getAuthSession();
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const agentId = searchParams.get('agentId');

  if (action === 'list-wallets') {
    const wallets = getAgentMPPWallets();
    return NextResponse.json({
      wallets: wallets.map(w => ({
        agentId: w.agentId,
        companyId: w.companyId,
        address: w.address,
      })),
    });
  }

  if (action === 'get-wallet' && agentId) {
    const address = getAgentWalletAddress(agentId);
    if (!address) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }
    return NextResponse.json({ agentId, address });
  }

  if (action === 'get-balance' && agentId) {
    try {
      const balance = await getAgentBalance(agentId);
      return NextResponse.json({ agentId, balance });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  return NextResponse.json({
    endpoints: {
      'GET /api/agent/mpp?action=list-wallets': 'List all agent wallets',
      'GET /api/agent/mpp?action=get-wallet&agentId=xxx': 'Get wallet for specific agent',
      'GET /api/agent/mpp?action=get-balance&agentId=xxx': 'Get USDC balance',
      'POST /api/agent/mpp': 'Create or manage wallet',
    },
  });
}

export async function POST(request: NextRequest) {
  const authSession = await getAuthSession();
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, agentId, companyId, privateKey } = body;

    if (action === 'create-wallet') {
      if (!agentId || !companyId) {
        return NextResponse.json(
          { error: 'agentId and companyId required' },
          { status: 400 }
        );
      }

      const wallet = createAgentWallet();
      
      const wallets = getAgentMPPWallets();
      wallets.push({
        agentId,
        companyId,
        privateKey: wallet.privateKey,
        address: wallet.address,
      });

      return NextResponse.json({
        success: true,
        agentId,
        companyId,
        address: wallet.address,
        privateKey: wallet.privateKey,
        message: 'Store this private key securely - it cannot be recovered!',
      });
    }

    if (action === 'register-wallet') {
      if (!agentId || !companyId || !privateKey) {
        return NextResponse.json(
          { error: 'agentId, companyId, and privateKey required' },
          { status: 400 }
        );
      }

      const wallet = registerAgentWallet(agentId, companyId, privateKey);

      return NextResponse.json({
        success: true,
        agentId: wallet.agentId,
        companyId: wallet.companyId,
        address: wallet.address,
      });
    }

    if (action === 'make-payment' && agentId) {
      const { url, method = 'GET', headers = {}, body: requestBody } = body;

      if (!url) {
        return NextResponse.json({ error: 'url required' }, { status: 400 });
      }

      try {
        const result = await makeMPPRequest(url, {
          method,
          headers,
          body: requestBody ? JSON.stringify(requestBody) : undefined,
          agentId,
        });

        return NextResponse.json({
          success: true,
          result,
        });
      } catch (error) {
        return NextResponse.json(
          { error: String(error) },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('MPP API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
