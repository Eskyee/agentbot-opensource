import { NextRequest } from 'next/server';
import { getOrchestrator } from '@/app/lib/agents/orchestrator';
import { getSubAgentTypes, getSubAgentConfig } from '@/app/lib/agents/subagents';
import { SubAgentType } from '@/app/lib/agents/types';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  const orchestrator = getOrchestrator();

  if (action === 'list') {
    return Response.json({
      agents: orchestrator.getAvailableAgents(),
    });
  }

  if (action === 'types') {
    return Response.json({
      types: getSubAgentTypes(),
    });
  }

  if (action === 'config') {
    const type = url.searchParams.get('type') as SubAgentType;
    if (!type) {
      return Response.json({ error: 'type parameter required' }, { status: 400 });
    }
    return Response.json({
      config: getSubAgentConfig(type),
    });
  }

  return Response.json({
    message: 'Agent Orchestrator API',
    actions: ['list', 'types', 'config', 'route'],
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { action, type, prompt, context } = body as {
    action?: string;
    type?: SubAgentType;
    prompt?: string;
    context?: Record<string, unknown>;
  };

  const orchestrator = getOrchestrator();

  if (action === 'route' && prompt) {
    const result = await orchestrator.orchestrate(prompt, context);
    return Response.json(result);
  }

  if (action === 'execute' && type && prompt) {
    const result = await orchestrator.routeToSubAgent(type, prompt, context);
    return Response.json(result);
  }

  return Response.json(
    { error: 'Invalid action. Use "route" or "execute" with prompt.' },
    { status: 400 }
  );
}
