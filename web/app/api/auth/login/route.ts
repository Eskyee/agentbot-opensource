import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check password (using bcrypt from Prisma)
    // Note: This assumes users were registered with bcrypt-hashed passwords
    // If using wallet auth, this endpoint is not used
    const isValidPassword = await verifyPassword(password, user.password || '');
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Simple bcrypt-like comparison
  // In production, use bcrypt or argon2
  try {
    // If hash is empty or null, password is not set
    if (!hash) return false;
    
    // For now, we'll do a simple comparison
    // In production, you should use bcrypt.compare()
    const { compare } = await import('bcryptjs');
    return await compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
