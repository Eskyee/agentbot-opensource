import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { encode } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const { address, signature } = await req.json();
    
    if (!address || !signature) {
      return NextResponse.json({ error: 'Missing address or signature' }, { status: 400 });
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

    // Create NextAuth JWT session token
    const token = await encode({
      token: {
        sub: user.id,
        name: user.name,
        email: user.email,
        walletAddress: address,
      },
      secret: process.env.NEXTAUTH_SECRET!,
    });

    // Set session cookie
    const response = NextResponse.json({ ok: true, user: { id: user.id, name: user.name } });
    response.cookies.set('next-auth.session-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Wallet auth error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
