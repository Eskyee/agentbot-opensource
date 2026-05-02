import { NextRequest, NextResponse } from 'next/server';
import { verifyMppCredential } from '@/lib/mpp/config';
import { PLUGIN_PRICING } from '@/lib/mpp/middleware';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transaction, challengeNonce } = body;

    if (!transaction || !challengeNonce) {
      return NextResponse.json({ error: 'Missing transaction or challengeNonce' }, { status: 400 });
    }

    const result = await verifyMppCredential(
      { transaction, challengeNonce },
      {
        expectedAmount: '0.01',
        expectedRecipient: '0xd8fd0e1dce89beaab924ac68098ddb17613db56f',
        expectedCurrency: '0x20c0000000000000000000000000000000000000',
      }
    );

    return NextResponse.json({ verification: result });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message, stack: error?.stack }, { status: 500 });
  }
}
