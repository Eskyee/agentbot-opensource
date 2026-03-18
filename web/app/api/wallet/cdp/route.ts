import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    type: 'evm_wallet',
    supportedChains: ['base', 'base-sepolia'],
  });
}

export async function POST(req: NextRequest) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch {}
    const { privateKey } = body as { privateKey?: string };

    let account;
    if (privateKey) {
      account = privateKeyToAccount(privateKey as `0x${string}`);
    } else {
      const { hexToBytes, bytesToHex } = await import('viem');
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const newKey = bytesToHex(randomBytes);
      account = privateKeyToAccount(newKey);
    }

    const client = createWalletClient({
      chain: baseSepolia,
      transport: http(),
      account,
    });

    return NextResponse.json({
      success: true,
      address: account.address,
      network: 'base-sepolia',
    });
  } catch (error: any) {
    console.error('Wallet error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create wallet',
    }, { status: 500 });
  }
}
