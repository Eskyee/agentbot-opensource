import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

interface AuthSessionUser {
  id: string;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
}

interface AuthSession {
  user: AuthSessionUser;
}

/**
 * Unified auth session helper.
 * Checks the custom `agentbot-session` cookie first (Prisma Session table),
 * then falls back to NextAuth's JWT-based `getServerSession`.
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  // 1. Check custom session cookie
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('agentbot-session')?.value;

  if (sessionToken) {
    try {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });

      if (session && session.expires > new Date()) {
        const adminEmails = (process.env.ADMIN_EMAILS || '')
          .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        const isAdmin = adminEmails.includes((session.user.email || '').toLowerCase());

        return {
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            isAdmin,
          },
        };
      }
    } catch (error) {
      console.error('Custom session lookup error:', error);
    }
  }

  // 2. Fall back to NextAuth JWT session
  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession?.user) {
    return {
      user: {
        id: (nextAuthSession.user as any).id || '',
        name: nextAuthSession.user.name || null,
        email: nextAuthSession.user.email || null,
        isAdmin: (nextAuthSession.user as any).isAdmin ?? false,
      },
    };
  }

  return null;
}
