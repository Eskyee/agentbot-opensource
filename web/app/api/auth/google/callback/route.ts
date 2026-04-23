import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';
import { attachSessionCookie } from '@/app/lib/session';

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
    
    // Fallback to request origin if env vars are missing
    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('[Google Auth] Missing credentials');
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
      // Log failure to a file we can check if possible (simulated via console.error for now)
      return NextResponse.redirect(new URL('/login?error=GoogleTokenFailed', req.url));
    }

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userRes.json();
    console.log(`[Google Auth] User Info: ${googleUser.email}`);

    if (!googleUser.email) {
      return NextResponse.redirect(new URL('/login?error=GoogleNoEmail', req.url));
    }

    // Find or create user
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: googleUser.email },
        include: { accounts: true },
      });
    } catch (dbError: any) {
      console.error('[Google Auth] DB User Lookup Error:', dbError.message);
      throw dbError;
    }

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name || googleUser.email.split('@')[0],
            image: googleUser.picture || null,
            emailVerified: new Date(),
          },
          include: { accounts: true },
        });
      } catch (createError: any) {
        console.error('[Google Auth] DB User Create Error:', createError.message);
        throw createError;
      }
    } else if (!user.image && googleUser.picture) {
      // Update profile image if missing
      await prisma.user.update({
        where: { id: user.id },
        data: { image: googleUser.picture },
      }).catch(() => {});
    }

    // Link Google account if not already linked
    const googleId = googleUser.id || googleUser.sub;
    const hasGoogleAccount = user.accounts.some(a => a.provider === 'google');
    if (!hasGoogleAccount && googleId) {
      try {
        await prisma.account.create({
          data: {
            userId: user.id,
            type: 'oauth',
            provider: 'google',
            providerAccountId: String(googleId),
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || null,
            expires_at: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
            token_type: tokens.token_type || null,
            scope: tokens.scope || null,
            id_token: tokens.id_token || null,
          },
        });
      } catch (accError: any) {
        // Unique constraint — account already linked (race condition)
        if (!String(accError).includes('Unique constraint')) {
          console.error('[Google Auth] DB Account Create Error:', accError.message);
        }
      }
    }

    // Create session
    let session;
    try {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      session = await prisma.session.create({
        data: {
          sessionToken,
          userId: user.id,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      
      // Set cookie and redirect
      const response = NextResponse.redirect(new URL('/dashboard', req.url));
      attachSessionCookie(response, session.sessionToken);
      return response;
    } catch (sessionError: any) {
      console.error('[Google Auth] DB Session Create Error:', sessionError.message);
      throw sessionError;
    }
  } catch (error: any) {
    console.error('[Google Auth] Callback error:', error.message);
    return NextResponse.redirect(new URL(`/login?error=GoogleAuthError&detail=${encodeURIComponent(error.message)}`, req.url));
  }
}
