import { NextRequest, NextResponse } from 'next/server';

const WRISTBAND_CONTRACT = process.env.WRISTBAND_CONTRACT_ADDRESS;

export async function GET(req: NextRequest) {
  if (!WRISTBAND_CONTRACT) {
    return NextResponse.json({
      status: 'not_configured',
      message: 'Wristband contract not deployed yet',
      comingSoon: true,
    });
  }

  return NextResponse.json({
    status: 'available',
    contract: WRISTBAND_CONTRACT,
    network: 'base',
    chainId: 8453,
    mintPrice: '0.001 ETH',
    maxSupply: 10000,
    opensea: `https://opensea.io/collection/wristband`,
    basescan: `https://basescan.org/address/${WRISTBAND_CONTRACT}`,
  });
}
