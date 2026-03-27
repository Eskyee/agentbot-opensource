/**
 * Agent Pipeline API
 * 6-step progression tracking: verify → wallet → gas → erc8004 → token → sponsorship
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity/logger';

const PIPELINE_STEPS = ['verify', 'wallet', 'gas', 'erc8004', 'token', 'sponsorship'];

// POST /api/agents/pipeline — create or update pipeline
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, agentId, step, status } = body;

    if (!userId || !agentId) {
      return NextResponse.json({ error: 'userId and agentId are required' }, { status: 400 });
    }

    // Find or create pipeline
    let pipeline = await prisma.agent_pipelines.findFirst({
      where: { userId, agentId },
    });

    if (!pipeline) {
      pipeline = await prisma.agent_pipelines.create({
        data: { userId, agentId, currentStep: 'verify', stepsCompleted: [], status: 'active' },
      });
    }

    // If advancing a step
    if (step) {
      const currentIdx = PIPELINE_STEPS.indexOf(pipeline.currentStep);
      const stepIdx = PIPELINE_STEPS.indexOf(step);

      if (stepIdx === -1) {
        return NextResponse.json({ error: `Invalid step: ${step}` }, { status: 400 });
      }

      const completed = (pipeline.stepsCompleted as string[]) || [];
      if (!completed.includes(step)) {
        completed.push(step);
      }

      const nextStep = stepIdx + 1 < PIPELINE_STEPS.length ? PIPELINE_STEPS[stepIdx + 1] : 'complete';
      const pipelineStatus = nextStep === 'complete' ? 'completed' : 'active';

      pipeline = await prisma.agent_pipelines.update({
        where: { id: pipeline.id },
        data: {
          currentStep: nextStep,
          stepsCompleted: completed,
          status: status || pipelineStatus,
        },
      });

      await logActivity({
        eventType: 'pipeline_step',
        humanId: userId,
        agentPublicKey: agentId,
        metadata: { step, nextStep, status: pipelineStatus },
      });
    }

    return NextResponse.json({
      success: true,
      pipeline: {
        id: pipeline.id,
        currentStep: pipeline.currentStep,
        stepsCompleted: pipeline.stepsCompleted,
        status: pipeline.status,
        allSteps: PIPELINE_STEPS,
        progress: `${((pipeline.stepsCompleted as string[])?.length || 0)}/${PIPELINE_STEPS.length}`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/agents/pipeline?userId=xxx&agentId=xxx
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const agentId = req.nextUrl.searchParams.get('agentId');

    if (!userId || !agentId) {
      return NextResponse.json({ error: 'userId and agentId are required' }, { status: 400 });
    }

    const pipeline = await prisma.agent_pipelines.findFirst({
      where: { userId, agentId },
    });

    if (!pipeline) {
      return NextResponse.json({
        pipeline: null,
        allSteps: PIPELINE_STEPS,
        message: 'No pipeline found. Create one with POST.',
      });
    }

    return NextResponse.json({
      pipeline: {
        id: pipeline.id,
        currentStep: pipeline.currentStep,
        stepsCompleted: pipeline.stepsCompleted,
        status: pipeline.status,
        allSteps: PIPELINE_STEPS,
        progress: `${((pipeline.stepsCompleted as string[])?.length || 0)}/${PIPELINE_STEPS.length}`,
        createdAt: pipeline.createdAt,
        updatedAt: pipeline.updatedAt,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
