/**
 * Preflight Checks API
 * Validates all requirements before operations.
 * Returns step-by-step status with next actions.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CheckResult {
  step: number;
  action: string;
  status: 'ready' | 'required' | 'blocked' | 'auto';
  detail?: string;
}

// GET /api/agents/preflight/:action?agentId=xxx
export async function GET(
  req: NextRequest,
) {
  try {
    const url = req.nextUrl;
    const agentId = url.searchParams.get('agentId');
    // Extract action from query param or default
    const action = url.searchParams.get('action') || 'setup';

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    const checks: CheckResult[] = [];
    let stepNum = 1;

    // Check 1: Agent exists and is verified
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, name: true, email: true },
    });

    checks.push({
      step: stepNum++,
      action: 'Agent exists and is registered',
      status: agent ? 'ready' : 'required',
      detail: agent ? `Agent: ${agent.name || agent.email}` : 'Agent not found in registry',
    });

    // Check 2: Pipeline exists
    const pipeline = await prisma.agent_pipelines.findFirst({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });

    const completedSteps = (pipeline?.stepsCompleted as string[]) || [];

    if (action === 'sponsorship' || action === 'token' || action === 'full') {
      // Check wallet
      checks.push({
        step: stepNum++,
        action: 'Wallet registered',
        status: completedSteps.includes('wallet') ? 'ready' : 'required',
        detail: completedSteps.includes('wallet')
          ? 'Wallet is registered'
          : 'Register a wallet address first',
      });

      // Check gas
      checks.push({
        step: stepNum++,
        action: 'Gas available',
        status: completedSteps.includes('gas') ? 'ready' : 'required',
        detail: completedSteps.includes('gas')
          ? 'Gas subsidy received'
          : 'Request gas subsidy for onchain transactions',
      });
    }

    if (action === 'sponsorship' || action === 'full') {
      // Check ERC-8004
      checks.push({
        step: stepNum++,
        action: 'ERC-8004 onchain identity',
        status: completedSteps.includes('erc8004') ? 'ready' : 'required',
        detail: completedSteps.includes('erc8004')
          ? 'Onchain identity registered'
          : 'Register ERC-8004 identity first',
      });

      // Check token
      checks.push({
        step: stepNum++,
        action: 'Token deployed',
        status: completedSteps.includes('token') ? 'ready' : 'required',
        detail: completedSteps.includes('token')
          ? 'Token is deployed'
          : 'Deploy an agent token first',
      });
    }

    // Pipeline status
    checks.push({
      step: stepNum++,
      action: 'Pipeline progression',
      status: pipeline ? 'ready' : 'required',
      detail: pipeline
        ? `Current: ${pipeline.currentStep} | Completed: ${completedSteps.join(', ') || 'none'}`
        : 'No pipeline found — create one to track progress',
    });

    const allReady = checks.every((c) => c.status === 'ready' || c.status === 'auto');

    return NextResponse.json({
      ready: allReady,
      action,
      agentId,
      checks,
      pipeline: pipeline
        ? {
            currentStep: pipeline.currentStep,
            stepsCompleted: completedSteps,
            status: pipeline.status,
          }
        : null,
      nextAction: allReady
        ? `All checks passed for ${action}`
        : checks.find((c) => c.status === 'required')?.detail || 'Resolve required checks above',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
