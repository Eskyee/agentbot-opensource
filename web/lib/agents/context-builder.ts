/**
 * Agent Context Builder
 * Depth-aware context loading — minimal/standard/full.
 * Only fetches what's needed, uses Promise.all for parallel queries.
 */
import { prisma } from '@/lib/prisma';

type ContextDepth = 'minimal' | 'standard' | 'full';

interface AgentContext {
  identity?: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    plan: string;
  };
  pipeline?: {
    currentStep: string;
    stepsCompleted: unknown[];
    status: string;
  } | null;
  services?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  revenue?: {
    totalEvents: number;
    totals: Record<string, number>;
    recent: Array<{ amount: string; token: string; source: string; createdAt: Date }>;
  };
  costs?: {
    totalEvents: number;
    totalUsd: number;
    byType: Record<string, number>;
  };
  activity?: Array<{
    eventType: string;
    metadata: unknown;
    createdAt: Date;
  }>;
}

/**
 * Build agent context with the requested depth
 */
export async function buildAgentContext(
  agentId: string,
  depth: ContextDepth = 'standard'
): Promise<AgentContext> {
  const context: AgentContext = {};

  // Always fetch identity (minimal)
  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    select: { id: true, name: true, email: true, role: true, plan: true },
  });

  if (!agent) return context;
  context.identity = agent;

  if (depth === 'minimal') return context;

  // Standard: wallet + pipeline (parallel)
  const [pipeline] = await Promise.all([
    prisma.agent_pipelines.findFirst({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  context.pipeline = pipeline
    ? {
        currentStep: pipeline.currentStep,
        stepsCompleted: (pipeline.stepsCompleted as unknown[]) || [],
        status: pipeline.status,
      }
    : null;

  if (depth === 'standard') return context;

  // Full: services + revenue + costs + activity (parallel)
  const [services, revenueEvents, costEvents, activity] = await Promise.all([
    prisma.agent.findMany({
      where: { userId: agentId },
      select: { id: true, name: true, status: true },
    }).catch(() => []),
    prisma.revenue_events.findMany({
      where: { humanId: agentId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }).catch(() => []),
    prisma.cost_events.findMany({
      where: { humanId: agentId },
    }).catch(() => []),
    prisma.agent_activity.findMany({
      where: { humanId: agentId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }).catch(() => []),
  ]);

  context.services = Array.isArray(services)
    ? services.map((s: { id: string; name: string; status: string }) => ({
        id: s.id,
        name: s.name,
        status: s.status,
      }))
    : [];

  // Aggregate revenue
  const revenueTotals: Record<string, number> = {};
  for (const event of revenueEvents) {
    revenueTotals[event.token] = (revenueTotals[event.token] || 0) + parseFloat(event.amount);
  }
  context.revenue = {
    totalEvents: revenueEvents.length,
    totals: revenueTotals,
    recent: revenueEvents.slice(0, 5).map((e) => ({
      amount: e.amount,
      token: e.token,
      source: e.source,
      createdAt: e.createdAt,
    })),
  };

  // Aggregate costs
  const costTotals: Record<string, number> = {};
  let totalCostUsd = 0;
  for (const event of costEvents) {
    costTotals[event.costType] = (costTotals[event.costType] || 0) + parseFloat(event.amount);
    if (event.currency === 'USD') totalCostUsd += parseFloat(event.amount);
  }
  context.costs = {
    totalEvents: costEvents.length,
    totalUsd: totalCostUsd,
    byType: costTotals,
  };

  context.activity = activity.map((a) => ({
    eventType: a.eventType,
    metadata: a.metadata,
    createdAt: a.createdAt,
  }));

  return context;
}
