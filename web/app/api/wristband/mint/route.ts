import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const WRISTBAND_CONTRACT = (process.env.WRISTBAND_CONTRACT_ADDRESS || '0x66519FCAee1Ed65bc9e0aCc25cCD900668D3eD49') as `0x${string}`;

// mintTo(address) function selector
const MINT_SELECTOR = '0x40c10f19';
// totalSupply() function selector
const SUPPLY_SELECTOR = '0x18160ddd';

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

export async function POST(req: NextRequest) {
  const { walletAddress } = await req.json();

  if (!walletAddress) {
    return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
  }

  try {
    // Read current supply via raw call
    const supplyHex = await publicClient.call({
      to: WRISTBAND_CONTRACT,
      data: SUPPLY_SELECTOR as `0x${string}`,
    });
    const supply = parseInt(String(supplyHex), 16);

    // Encode mintTo(address) calldata
    const addr = walletAddress.slice(2).toLowerCase().padStart(64, '0');
    const calldata = `${MINT_SELECTOR}${addr}` as `0x${string}`;

    return NextResponse.json({
      success: true,
      contract: WRISTBAND_CONTRACT,
      network: 'base',
      mintTo: walletAddress,
      nextTokenId: supply,
      calldata,
    });
  } catch (error) {
    console.error('Mint prep error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
