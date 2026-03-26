import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  // Handle Google error responses (e.g., user cancelled)
  const googleError = req.nextUrl.searchParams.get('error');
  if (googleError) {
    console.log(`[Google Auth] User denied or error: ${googleError}`);
    return NextResponse.redirect(new URL(`/login?error=${googleError === 'access_denied' ? 'AccessDenied' : 'GoogleAuthFailed'}`, req.url));
  }

  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=GoogleAuthFailed', req.url));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('[Google Auth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
      return NextResponse.redirect(new URL('/login?error=GoogleNotConfigured', req.url));
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      console.error('[Google Auth] Token exchange failed:', tokens);
      return NextResponse.redirect(new URL('/login?error=GoogleTokenFailed', req.url));
    }

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(new URL('/login?error=GoogleNoEmail', req.url));
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { accounts: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          image: googleUser.picture || null,
          emailVerified: new Date(),
        },
        include: { accounts: true },
      });
    } else if (!user.image && googleUser.picture) {
      // Update profile image if missing
      await prisma.user.update({
        where: { id: user.id },
        data: { image: googleUser.picture },
      }).catch(() => {});
    }

    // Link Google account if not already linked
    const hasGoogleAccount = user.accounts.some(a => a.provider === 'google');
    if (!hasGoogleAccount && googleUser.id) {
      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: googleUser.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          expires_at: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
          token_type: tokens.token_type || null,
          scope: tokens.scope || null,
          id_token: tokens.id_token || null,
        },
      }).catch((err) => {
        // Unique constraint — account already linked (race condition)
        if (!String(err).includes('Unique constraint')) {
          console.error('[Google Auth] Account link error:', err);
        }
      });
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Set cookie and redirect
    const response = NextResponse.redirect(new URL('/dashboard', req.url));
    response.cookies.set('agentbot-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('[Google Auth] Callback error:', error);
    return NextResponse.redirect(new URL('/login?error=GoogleAuthError', req.url));
  }
}
