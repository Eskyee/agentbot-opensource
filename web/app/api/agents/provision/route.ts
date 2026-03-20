export const dynamic = "force-dynamic"
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
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { stripe } from '@/app/lib/stripe';
import crypto from 'crypto';

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
}

/**
 * POST /api/agents/provision
 * Create and provision a new OpenClaw agent
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
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

    // Validate name length (max 100 chars)
    if (body.name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Agent name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Check subscription tier
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.subscriptionStatus !== 'active') {
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
      starter: 1,
      pro: 3,
      enterprise: 100
    };

    const limit = tierLimits[user.plan] || 1;
    if (agentCount >= limit) {
      return NextResponse.json(
        { 
          error: `Agent limit reached for ${user.plan} tier`,
          current: agentCount,
          limit
        },
        { status: 429 }
      );
    }

    // Create agent record
    const agent = await prisma.agent.create({
      data: {
        userId,
        name: body.name.trim(),
        model: body.model || 'claude-opus-4-6',
        status: 'provisioning',
        config: body.config || {},
        websocketUrl: `ws://openclaw-gateway-lqma:10000/agent/${userId}`
      }
    });

    // Send provisioning request to OpenClaw Gateway
    try {
      const gatewayResponse = await provisionAgentOnGateway(agent.id, {
        userId,
        name: agent.name,
        model: agent.model || 'default',
        config: agent.config as Record<string, any> || {}
      });

      // Update agent status
      await prisma.agent.update({
        where: { id: agent.id },
        data: { 
          status: 'running',
          config: {
            ...(agent.config as Record<string, any> || {}),
            gatewayId: gatewayResponse.gatewayId,
            authToken: gatewayResponse.token
          }
        }
      });

      return NextResponse.json({
        success: true,
        agent: {
          id: agent.id,
          name: agent.name,
          status: 'running',
          websocketUrl: agent.websocketUrl,
          model: agent.model,
          createdAt: agent.createdAt
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
    const session = await getServerSession(authOptions);
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
 * Helper: Provision agent on OpenClaw Gateway
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
  const GATEWAY_URL = 'ws://openclaw-gateway-lqma:10000';

  return new Promise((resolve, reject) => {
    try {
      // In production, use fetch or axios to call gateway HTTP API
      // This is a placeholder for the actual provisioning logic
      
      const gatewayPayload = {
        type: 'provision_agent',
        agentId,
        userId: config.userId,
        name: config.name,
        model: config.model,
        config: config.config,
        timestamp: new Date().toISOString()
      };

      // TODO: Call OpenClaw Gateway provisioning endpoint
      // For now, simulate successful provisioning
      
      resolve({
        gatewayId: `gw-${agentId}`,
        token: generateAuthToken(),
        status: 'provisioned'
      });

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper: Generate auth token for agent
 */
function generateAuthToken(): string {
  // Cryptographically secure token — never use Math.random() for auth
  return crypto.randomBytes(32).toString('base64url');
}

// metadata removed: not a valid Next.js Route export
