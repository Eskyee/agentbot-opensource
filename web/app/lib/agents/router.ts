import { SubAgentType, SubAgentTask, SubAgentResult } from './types';
import { getSubAgentConfig, SUB_AGENT_CONFIGS } from './subagents';

interface RouteDecision {
  type: SubAgentType;
  reason: string;
  confidence: number;
}

const ROUTING_KEYWORDS: Record<SubAgentType, string[]> = {
  coding: [
    'code',
    'write',
    'function',
    'debug',
    'fix',
    'implement',
    'refactor',
    'file',
    'script',
    'typescript',
    'javascript',
    'python',
    'api',
    'endpoint',
    'component',
    'test',
  ],
  research: [
    'search',
    'find',
    'research',
    'look up',
    'what is',
    'how to',
    'explain',
    'analyze',
    'compare',
    'review',
    'article',
    'documentation',
    'docs',
  ],
  social: [
    'post',
    'tweet',
    'social',
    'share',
    'announce',
    'content',
    'blog',
    'newsletter',
    'engagement',
    'followers',
    'twitter',
    'linkedin',
    'instagram',
  ],
  voice: [
    'voice',
    'speak',
    'audio',
    'speech',
    'transcribe',
    'tts',
    'stt',
    'listen',
    'record',
    'podcast',
    'call',
  ],
  data: [
    'data',
    'query',
    'database',
    'sql',
    'analyze',
    'chart',
    'graph',
    'metrics',
    'report',
    'dashboard',
    'statistics',
    'analytics',
  ],
  security: [
    'security',
    'validate',
    'sanitize',
    'auth',
    'permission',
    'threat',
    'vulnerability',
    'scan',
    'protect',
    'encrypt',
    'token',
  ],
};

export function routeTask(task: SubAgentTask): RouteDecision {
  const promptLower = task.prompt.toLowerCase();

  const scores: Record<SubAgentType, number> = {
    coding: 0,
    research: 0,
    social: 0,
    voice: 0,
    data: 0,
    security: 0,
  };

  for (const [type, keywords] of Object.entries(ROUTING_KEYWORDS)) {
    for (const keyword of keywords) {
      if (promptLower.includes(keyword)) {
        scores[type as SubAgentType] += 1;
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores));
  const bestType = Object.entries(scores).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0] as SubAgentType;

  if (maxScore === 0) {
    return { type: 'research', reason: 'Default routing: no keyword match', confidence: 0.5 };
  }

  return {
    type: bestType,
    reason: `Keyword match: ${scores[bestType]} hits for ${bestType}`,
    confidence: Math.min(maxScore / 5, 1),
  };
}

export function createSubAgentTask(
  type: SubAgentType,
  prompt: string,
  context?: Record<string, unknown>,
  parentId?: string
): SubAgentTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    prompt,
    context,
    parentId,
    priority: 'normal',
    createdAt: new Date(),
    timeout: 30000,
  };
}

export async function executeSubAgent(task: SubAgentTask): Promise<SubAgentResult> {
  const config = getSubAgentConfig(task.type);
  const startTime = Date.now();

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: task.prompt },
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      // Try fallback model
      const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: config.fallbackModel,
          messages: [
            { role: 'system', content: config.systemPrompt },
            { role: 'user', content: task.prompt },
          ],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        }),
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Both models failed: ${response.status} / ${fallbackResponse.status}`);
      }

      const fallbackData = await fallbackResponse.json();
      return {
        taskId: task.id,
        type: task.type,
        status: 'success',
        output: fallbackData.choices[0]?.message?.content || '',
        duration: Date.now() - startTime,
        tokensUsed: fallbackData.usage?.total_tokens || 0,
        metadata: { model: config.fallbackModel, fallback: true },
      };
    }

    const data = await response.json();
    return {
      taskId: task.id,
      type: task.type,
      status: 'success',
      output: data.choices[0]?.message?.content || '',
      duration: Date.now() - startTime,
      tokensUsed: data.usage?.total_tokens || 0,
      metadata: { model: config.model },
    };
  } catch (error) {
    return {
      taskId: task.id,
      type: task.type,
      status: 'error',
      output: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
      tokensUsed: 0,
    };
  }
}
