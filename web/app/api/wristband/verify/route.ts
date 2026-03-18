import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const WRISTBAND_CONTRACT = process.env.WRISTBAND_CONTRACT_ADDRESS as `0x${string}`;

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const address = searchParams.get('address') as `0x${string}`;

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  if (!WRISTBAND_CONTRACT) {
    return NextResponse.json({ 
      hasWristband: false, 
      error: 'Contract not configured' 
    });
  }

  try {
    const balance = await publicClient.readContract({
      address: WRISTBAND_CONTRACT,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          inputs: [{ name: 'owner', type: 'address' }],
          outputs: [{ type: 'uint256' }],
          stateMutability: 'view',
        },
      ],
      functionName: 'balanceOf',
      args: [address],
    });

    const hasWristband = (balance as bigint) > 0n;

    return NextResponse.json({ 
      hasWristband,
      address,
      contract: WRISTBAND_CONTRACT 
    });
  } catch (error) {
    console.error('Wristband check error:', error);
    return NextResponse.json({ 
      hasWristband: false, 
      error: String(error) 
    });
  }
}
