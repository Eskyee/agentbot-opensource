import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { encode } from 'next-auth/jwt';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

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
      where: {
        OR: [
          { email: walletEmail },
          { name: address },
        ]
      }
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

    // Create NextAuth JWT with ALL required fields
    const secret = process.env.NEXTAUTH_SECRET || 'dev-secret-do-not-use-in-production-12345';
    const token = await encode({
      token: {
        sub: user.id,
        name: user.name,
        email: user.email,
        walletAddress: address,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        jti: crypto.randomUUID(),
      },
      secret,
      maxAge: 30 * 24 * 60 * 60,
    });

    // Set session cookie (matches NextAuth production cookie name)
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token';
    
    const response = NextResponse.json({ ok: true, user: { id: user.id, name: user.name } });
    
    // Set cookie with explicit domain for Vercel
    const cookieValue = `${cookieName}=${token}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    response.headers.set('Set-Cookie', cookieValue);

    return response;
  } catch (error) {
    console.error('Wallet auth error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
