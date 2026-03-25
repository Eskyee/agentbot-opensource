import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyPaymentProof, type CloneRequest, type PaymentProof } from '@/lib/x402-tempo';
import { createAgentWallet, registerAgentWallet } from '@/lib/mpp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentAgentId, name, specialization, paymentProof } = body as CloneRequest & {
      paymentProof: PaymentProof;
    };

    // Validate required fields
    if (!parentAgentId || !name || !paymentProof) {
      return NextResponse.json(
        { error: 'Missing required fields: parentAgentId, name, paymentProof' },
        { status: 400 }
      );
    }

    // Verify payment proof on-chain
    const isValid = await verifyPaymentProof(paymentProof);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment proof — transaction not verified on Tempo chain' },
        { status: 402 }
      );
    }

    // Generate new agent ID — crypto-secure
    const agentId = `agent_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Create wallet for the new agent
    const wallet = createAgentWallet();

    // Register the wallet
    registerAgentWallet(agentId, 'clone', wallet.privateKey);

    // Calculate generation (how many hops from root)
    const generation = (body.generation || 1) + 1;

    // TODO: Store in database
    // TODO: Spawn Docker container for the agent
    // TODO: Set up parent-child revenue sharing
    // TODO: Update colony fitness scores

    return NextResponse.json({
      success: true,
      agentId,
      walletAddress: wallet.address,
      parentAgentId,
      generation,
      transactionHash: paymentProof.transactionHash,
      specialization: specialization || 'general',
      status: 'provisioning',
      message: `Agent "${name}" cloned successfully. Wallet funded with 0 pathUSD.`,
    });
  } catch (error) {
    console.error('[Clone] Error:', error);
    return NextResponse.json(
      { error: 'Clone failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Health check for the clone endpoint
export async function GET() {
  return NextResponse.json({
    service: 'agentbot-clone',
    version: '0.1.0',
    protocol: 'x402-tempo',
    clonePrice: '1.0 pathUSD',
    chainId: 4217,
  });
}
