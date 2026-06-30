import { prisma } from '@/app/lib/prisma';

interface AutomationConfig {
  id: string;
  name: string;
  prompt: string;
  model: string;
  triggers: any[];
  action: any;
  mcpServers: string[];
  acuLimit?: number | null;
}

interface ExecutionContext {
  triggerType: string;
  triggerPayload: any;
  userId: string;
}

export async function executeAutomation(automation: AutomationConfig, context: ExecutionContext) {
  const startTime = Date.now();

  try {
    // Build the full prompt with context
    const fullPrompt = buildPrompt(automation.prompt, context);

    // Call the AI gateway to generate a response
    const response = await fetch(`${process.env.NEXTAUTH_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: automation.model || 'openrouter/auto',
        messages: [
          {
            role: 'system',
            content:
              'You are an autonomous agent. Execute the task described in the user message. Be thorough and precise.',
          },
          { role: 'user', content: fullPrompt },
        ],
        max_tokens: automation.acuLimit || 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || 'No output generated';
    const tokensUsed = data.usage?.total_tokens || 0;
    const duration = Date.now() - startTime;

    return {
      status: 'completed',
      output,
      tokensUsed,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    };
  }
}

function buildPrompt(basePrompt: string, context: ExecutionContext): string {
  const parts = [basePrompt];

  if (context.triggerType && context.triggerPayload) {
    parts.push(`\nTrigger: ${context.triggerType}`);
    parts.push(`Context: ${JSON.stringify(context.triggerPayload, null, 2).slice(0, 2000)}`);
  }

  return parts.join('\n');
}

export async function processPendingRuns() {
  const pendingRuns = await prisma.automationRun.findMany({
    where: { status: 'running' },
    include: { automation: true },
    take: 10,
  });

  for (const run of pendingRuns) {
    const automation = run.automation as any;
    const result = await executeAutomation(
      {
        id: automation.id,
        name: automation.name,
        prompt: (automation.action as any)?.prompt || '',
        model: automation.model || 'openrouter/auto',
        triggers: automation.triggers,
        action: automation.action,
        mcpServers: automation.mcpServers,
      },
      {
        triggerType: run.triggerType,
        triggerPayload: run.triggerPayload,
        userId: automation.userId,
      }
    );

    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: result.status,
        output: result.output || null,
        error: result.error || null,
        duration: result.duration,
        tokensUsed: result.tokensUsed || null,
        completedAt: new Date(),
      },
    });
  }
}
