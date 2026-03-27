import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get('agentbot-session')?.value;
  
  if (!sessionToken) {
    return NextResponse.json({ user: null });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        isAdmin: (() => {
          const adminEmails = (process.env.ADMIN_EMAILS || '')
            .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
          return adminEmails.includes((session.user.email || '').toLowerCase());
        })(),
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null });
  }
}
