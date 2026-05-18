import { prisma } from '@/app/lib/prisma';
import { getAuthSession } from '@/app/lib/getAuthSession';
import crypto from 'crypto';

export type AuthSession = Awaited<ReturnType<typeof getAuthSession>>;

/**
 * Creates or finds a SocialUser from the current auth session.
 */
export async function ensureLocalUser(sessionUserId: string) {
  const existing = await prisma.socialUser.findUnique({
    where: { agentbotUserId: sessionUserId },
  });
  if (existing) return existing;

  return prisma.socialUser.create({
    data: { agentbotUserId: sessionUserId },
  });
}

/**
 * Verifies that the caller (localUser) owns the given SocialAgent id.
 * Returns the agent if valid, null otherwise.
 */
export async function ensureSocialAgent(agentId: string, localUserId: string) {
  const agent = await prisma.socialAgent.findUnique({
    where: { id: agentId },
  });
  if (!agent || agent.ownerUserId !== localUserId) return null;
  return agent;
}

/**
 * Generates a challenge code like "ABT-7Q2P-91K".
 */
export function generateChallengeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (len: number) => {
    const buf = crypto.randomBytes(len);
    let out = '';
    for (let i = 0; i < len; i++) {
      out += chars[buf[i] % chars.length];
    }
    return out;
  };
  return `ABT-${seg(4)}-${seg(3)}`;
}

/**
 * Checks if the session user has admin role.
 */
export async function isAdminUser(session: AuthSession): Promise<boolean> {
  if (!session?.user) return false;
  return session.user.isAdmin === true;
}
