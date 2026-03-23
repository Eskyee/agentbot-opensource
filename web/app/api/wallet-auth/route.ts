import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import crypto from 'crypto';

const viemClient = createPublicClient({ chain: base, transport: http() });

export async function POST(req: NextRequest) {
  try {
    const { address, message, signature } = await req.json();
    
    if (!address || !message || !signature) {
      return NextResponse.json({ error: 'Missing: address, message, signature' }, { status: 400 });
    }

    // Verify SIWE signature (viem handles ERC-6492 for smart wallets)
    let valid = false;
    try {
      valid = await viemClient.verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
    } catch (e) {
      console.error('[WalletAuth] Signature verification failed:', e);
    }

    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Find or create user
    const walletEmail = `${address.toLowerCase()}@wallet.agentbot`;
    let user = await prisma.user.findFirst({
      where: { OR: [{ email: walletEmail }, { name: address }] }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: `Wallet:${address.slice(0, 6)}...${address.slice(-4)}`,
          email: walletEmail,
          emailVerified: new Date(),
        },
      });
    }

    // Create simple session token (not JWT — just a lookup key)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Store session in DB
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Set cookie
    const response = NextResponse.json({ ok: true, user: { id: user.id, name: user.name } });
    response.cookies.set('agentbot-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Wallet auth error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
