import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;
  const id = parseInt(tokenId);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
  }

  const metadata = {
    name: `Digital Wristband #${id}`,
    description: 'Onchain access to baseFM underground radio. Grants lifetime access to HD live streams, token-gated channels, and exclusive artist drops.',
    image: 'https://agentbot.raveculture.xyz/wristband-nft.png',
    external_url: 'https://agentbot.raveculture.xyz/wristband',
    attributes: [
      {
        trait_type: 'Edition',
        value: id === 1 ? 'Founding Member' : `Edition ${id}`,
      },
      {
        trait_type: 'Network',
        value: 'Base',
      },
      {
        trait_type: 'Access Level',
        value: 'Premium',
      },
    ],
  };

  return NextResponse.json(metadata, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
