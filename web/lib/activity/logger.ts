/**
 * Structured Activity Logging
 * Writes events to agent_activity table with humanId, agentPublicKey, metadata.
 */
import { prisma } from '@/lib/prisma';

interface ActivityEvent {
  eventType: string;
  humanId?: string;
  agentPublicKey?: string;
  agentName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an activity event to the database
 */
export async function logActivity(event: ActivityEvent): Promise<void> {
  try {
    await prisma.agent_activity.create({
      data: {
        eventType: event.eventType,
        humanId: event.humanId || null,
        agentPublicKey: event.agentPublicKey || null,
        agentName: event.agentName || null,
        metadata: event.metadata ? JSON.parse(JSON.stringify(event.metadata)) : undefined,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[activity] Log error:', msg);
    // Don't throw — activity logging should never break the main flow
  }
}

/**
 * Query recent activity for an agent
 */
export async function getRecentActivity(
  agentPublicKey: string,
  limit = 20
) {
  return prisma.agent_activity.findMany({
    where: { agentPublicKey },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Query activity by event type
 */
export async function getActivityByType(
  eventType: string,
  limit = 50
) {
  return prisma.agent_activity.findMany({
    where: { eventType },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
