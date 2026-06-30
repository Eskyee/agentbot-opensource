import { NextRequest, NextResponse } from 'next/server';
import { createAgentBookVerifier } from '@worldcoin/agentkit';

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')?.trim();

  if (!address || !EVM_ADDRESS_PATTERN.test(address)) {
    return NextResponse.json({ error: 'Valid EVM address required' }, { status: 400 });
  }

  try {
    const agentBook = createAgentBookVerifier({
      rpcUrl: process.env.WORLD_CHAIN_RPC_URL,
    });
    const humanId = await (agentBook as any).lookupHuman(address);

    return NextResponse.json({
      address,
      registered: Boolean(humanId),
      humanId,
      agentBook: {
        network: 'eip155:480',
        contractAddress: '0xA23aB2712eA7BBa896930544C7d6636a96b944dA',
      },
    });
  } catch (error) {
    console.error('[agentkit/status] lookup failed:', error);
    return NextResponse.json(
      { error: 'Failed to look up AgentBook registration' },
      { status: 500 }
    );
  }
}
