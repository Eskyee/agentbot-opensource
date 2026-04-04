/**
 * Agent Provisioning API
 * Allows users to deploy new OpenClaw agents
 * 
 * Endpoints:
 * POST   /api/agents/provision         - Create new agent
 * GET    /api/agents                   - List user's agents
 * GET    /api/agents/:id               - Get agent details
 * DELETE /api/agents/:id               - Delete agent
 * POST   /api/agents/:id/restart       - Restart agent
 * 
 * Integration with:
 * - OpenClaw Gateway (ws://openclaw-gateway-lqma:10000)
 * - PostgreSQL (agent configs, metadata)
 * - Stripe (billing/subscription)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';
import { isTrialActive } from '@/app/lib/trial-utils'
import { provisionOnRailway, isRailwayConfigured } from '@/app/lib/railway-provision'
import { 
  deployAgentToGateway, 
  fetchAgentDataForDeployment,
} from '@/app/lib/agent-deploy'

export const dynamic = 'force-dynamic';

// Types
interface ProvisionAgentRequest {
  name: string;
  model?: 'claude-opus-4-6' | 'gpt-4' | 'custom';
  config?: Record<string, any>;
  tier?: 'starter' | 'pro' | 'enterprise';
}

interface AgentConfig {
  id: string;
  userId: string;
  name: string;
  model: string;
  status: 'provisioning' | 'running' | 'stopped' | 'error';
  createdAt: Date;
  updatedAt: Date;
  websocketUrl: string;
  config: Record<string, any>;
  algorithmMode?: boolean;
}

function normalizeProvisionPlan(plan?: string | null): string {
  switch ((plan || '').toLowerCase()) {
    case 'starter':
    case 'free':
    case 'underground':
    case 'solo':
      return 'solo'
    case 'pro':
    case 'collective':
      return 'collective'
    case 'label':
      return 'label'
    case 'enterprise':
    case 'network':
      return 'network'
    default:
      return 'solo'
  }
}

/**
 * POST /api/agents/provision
 * Create and provision a new OpenClaw agent
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body: ProvisionAgentRequest = await request.json();

    // Validate input
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }

    // Admin bypass helper
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const isAdmin = adminEmails.includes((session.user.email || '').toLowerCase());

    // Check subscription tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        openclawUrl: true,
        openclawInstanceId: true,
      },
    });
    const trialActive = isTrialActive(user?.trialEndsAt)

    if (!isAdmin && (!user || (!trialActive && user.subscriptionStatus !== 'active'))) {
      return NextResponse.json(
        { error: 'Active subscription required to provision agents' },
        { status: 402 }
      );
    }

    // Check agent limit by tier
    const agentCount = await prisma.agent.count({
      where: { userId }
    });

    const tierLimits: Record<string, number> = {
      free: 1,
      underground: 1,
      solo: 1,
      starter: 1,
      collective: 3,
      pro: 3,
      label: 10,
      network: 100,
      enterprise: 100
    };

    const limit = isAdmin ? 999 : (tierLimits[user?.plan ?? ''] || 1);
    if (agentCount >= limit) {
      return NextResponse.json(
        { 
          error: `Agent limit reached for ${user?.plan ?? 'free'} tier`,
          current: agentCount,
          limit
        },
        { status: 429 }
      );
    }

    const existingRuntimeUrl = user?.openclawUrl?.replace(/\/$/, '') || null
    const existingRuntimeId = user?.openclawInstanceId || null
    const requestedPlan = normalizeProvisionPlan(
      body.tier || (typeof body.config?.tier === 'string' ? body.config.tier : null) || user?.plan || null
    )

    // Create agent record with ALL data (skills, memories, files)
    const agent = await prisma.agent.create({
      data: {
        userId,
        name: body.name.trim(),
        model: body.model || 'claude-opus-4-6',
        status: 'provisioning',
        tier: requestedPlan,
        config: {
          ...(body.config || {}),
          managedRuntime: true,
          runtimePlan: requestedPlan,
        },
        websocketUrl: existingRuntimeUrl,
      }
    });

    // First deploy for a user: create the managed Railway runtime and persist it.
    // This is the path the frontend one-click deploy flow needs.
    if (!existingRuntimeUrl || !existingRuntimeId) {
      if (!isRailwayConfigured()) {
        await prisma.agent.update({
          where: { id: agent.id },
          data: {
            status: 'error',
            config: {
              ...(agent.config as Record<string, unknown> || {}),
              error: 'Railway provisioning is not configured',
            },
          },
        })

        return NextResponse.json(
          { error: 'Managed runtime provisioning is not configured' },
          { status: 503 }
        )
      }

      try {
        const runtime = await provisionOnRailway(agent.id, requestedPlan)

        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: {
              openclawUrl: runtime.url,
              openclawInstanceId: runtime.agentId,
            },
          }),
          prisma.agent.update({
            where: { id: agent.id },
            data: {
              status: runtime.status,
              websocketUrl: runtime.url,
              config: {
                ...(agent.config as Record<string, unknown> || {}),
                runtimeUrl: runtime.url,
                runtimeServiceId: runtime.serviceId,
                pendingGatewaySync: true,
              },
            },
          }),
        ])

        return NextResponse.json({
          success: true,
          agent: {
            id: agent.id,
            name: agent.name,
            status: runtime.status,
            websocketUrl: runtime.url,
            model: agent.model,
            createdAt: agent.createdAt,
            runtime: {
              instanceId: runtime.agentId,
              url: runtime.url,
              serviceId: runtime.serviceId,
            },
          },
        }, { status: 201 })
      } catch (runtimeError) {
        await prisma.agent.update({
          where: { id: agent.id },
          data: {
            status: 'error',
            config: {
              ...(agent.config as Record<string, unknown> || {}),
              error: runtimeError instanceof Error ? runtimeError.message : 'Railway provisioning failed',
            },
          },
        })

        throw runtimeError
      }
    }

    // Send FULL deployment to OpenClaw Gateway (includes skills, memories, files)
    try {
      // Fetch complete agent data with relations
      const agentData = await fetchAgentDataForDeployment(agent.id);
      
      // Deploy everything to gateway
      const deployResult = await deployAgentToGateway({
        agentId: agent.id,
        userId,
        name: agent.name,
        model: agent.model || 'default',
        config: {
          ...agentData.config,
          telegramToken: body.config?.telegramToken,
          aiProvider: body.model === 'claude-opus-4-6' ? 'anthropic' : (body.config?.aiProvider || 'openrouter'),
          apiKey: body.config?.apiKey,
          plan: body.tier || 'free',
          ownerIds: body.config?.ownerIds,
        },
        skills: agentData.skills,
        memories: agentData.memories,
        files: agentData.files,
      });

      if (!deployResult.success) {
        throw new Error(deployResult.error || 'Gateway deployment failed');
      }

      // Update agent status
      await prisma.agent.update({
        where: { id: agent.id },
        data: { 
          status: 'running',
          websocketUrl: existingRuntimeUrl,
          config: {
            ...(agent.config as Record<string, any> || {}),
            gatewayId: deployResult.gatewayId || `gw-${agent.id}`,
            deployedAt: deployResult.deployedAt,
            deployedSkills: deployResult.details?.skillsDeployed || 0,
            deployedMemories: deployResult.details?.memoriesDeployed || 0,
            deployedFiles: deployResult.details?.filesDeployed || 0,
            runtimeUrl: existingRuntimeUrl,
          }
        }
      });

      return NextResponse.json({
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          status: 'running',
          websocketUrl: existingRuntimeUrl,
          model: agent.model,
          createdAt: agent.createdAt,
          deployed: {
            skills: deployResult.details?.skillsDeployed || 0,
            memories: deployResult.details?.memoriesDeployed || 0,
            files: deployResult.details?.filesDeployed || 0,
          }
        }
      }, { status: 201 });

    } catch (gatewayError) {
      // Mark as error if gateway provisioning fails
      await prisma.agent.update({
        where: { id: agent.id },
        data: { 
          status: 'error',
          config: {
            ...(agent.config as Record<string, any> || {}),
            error: gatewayError instanceof Error ? gatewayError.message : 'Gateway provisioning failed'
          }
        }
      });

      throw gatewayError;
    }

  } catch (error) {
    console.error('Agent provisioning error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to provision agent'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents
 * List all agents for the user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const agents = await prisma.agent.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        model: true,
        status: true,
        websocketUrl: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      agents,
      count: agents.length
    });

  } catch (error) {
    console.error('List agents error:', error);
    return NextResponse.json(
      { error: 'Failed to list agents' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Provision agent on OpenClaw backend via /api/deployments
 */
async function provisionAgentOnGateway(
  agentId: string,
  config: {
    userId: string;
    name: string;
    model: string;
    config: Record<string, any>;
  }
): Promise<{ gatewayId: string; token: string; status: string }> {
  const GATEWAY_HTTP_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://openclaw-gateway-lqma:10000';
  const apiSecret = (process.env.BACKEND_API_SECRET || process.env.INTERNAL_API_KEY)?.trim();

  const gatewayPayload = {
    type: 'provision_agent',
    agentId,
    userId: config.userId,
    name: config.name,
    model: config.model,
    config: {
      ...config.config,
      telegramToken: config.config.telegramToken,
      aiProvider: config.model === 'claude-opus-4-6' ? 'anthropic' : (config.config.aiProvider || 'openrouter'),
      apiKey: config.config.apiKey,
      plan: config.config.tier || 'label',
      ownerIds: config.config.ownerIds,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(`${GATEWAY_HTTP_URL}/api/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiSecret ? { 'X-Internal-Key': apiSecret } : {}),
      },
      body: JSON.stringify(gatewayPayload),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`Gateway responded ${response.status}: ${errorBody}`);
    }

    const data = await response.json() as { gatewayId?: string; id?: string; token?: string; status?: string };

    return {
      gatewayId: data.gatewayId || data.id || `gw-${agentId}`,
      token: data.token || generateAuthToken(),
      status: data.status || 'provisioned',
    };
  } catch (error) {
    // If gateway is unreachable (e.g. local dev), provision with a local token
    // so the agent record is still created — gateway sync happens on next heartbeat
    console.warn(`[Provision] Gateway unreachable, provisioning locally: ${error instanceof Error ? error.message : error}`);

    return {
      gatewayId: `local-${agentId}`,
      token: generateAuthToken(),
      status: 'pending_gateway_sync',
    };
  }
}

/**
 * Helper: Generate auth token for agent
 */
function generateAuthToken(): string {
  // Cryptographically secure token — never use Math.random() for auth
  return crypto.randomBytes(32).toString('base64url');
}

// metadata removed: not a valid Next.js Route export
