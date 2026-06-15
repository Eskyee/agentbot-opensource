import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import crypto from 'crypto';
import { attachSessionCookie } from '@/app/lib/session';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { consumeWalletNonce } from '@/app/lib/wallet-nonce';

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

    const nonceMatch = typeof message === 'string' ? message.match(/Nonce: (\S+)/) : null
    const messageAddressMatch = typeof message === 'string'
      ? message.match(/Wallet: (0x[a-fA-F0-9]{40})/)
      : null

    if (!nonceMatch) {
      return NextResponse.json({ error: 'Missing nonce in signed message' }, { status: 400 });
    }

    if (messageAddressMatch && messageAddressMatch[1].toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: 'Signed wallet address mismatch' }, { status: 401 });
    }

    const nonceOk = await consumeWalletNonce(nonceMatch[1])
    if (!nonceOk) {
      return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 });
    }

    const walletAddress = address.toLowerCase()
    const walletEmail = `${walletAddress}@wallet.agentbot`

    // CONNECT vs SIGN-IN.
    // If the caller is already authenticated (e.g. a DJ signed in via Google),
    // this is a "connect wallet" action: LINK the address to the current account
    // and keep their identity. Never mint a new session or swap them into a
    // separate wallet-user — that was the bug that logged users in as someone else.
    const current = await getAuthSession()
    if (current?.user?.id) {
      await prisma.user.update({
        where: { id: current.user.id },
        data: { vaultId: walletAddress },
      })
      // No new cookie — the existing session stays intact.
      return NextResponse.json({
        ok: true,
        linked: true,
        user: { id: current.user.id, name: current.user.name },
      })
    }

    // Anonymous visitor → sign in. Find the existing wallet-user or create one.
    let user = await prisma.user.findFirst({ where: { email: walletEmail } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: `Wallet:${address.slice(0, 6)}...${address.slice(-4)}`,
          email: walletEmail,
          emailVerified: new Date(),
          vaultId: walletAddress,
        },
      })
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
    attachSessionCookie(response, sessionToken);

    return response;
  } catch (error) {
    console.error('Wallet auth error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
