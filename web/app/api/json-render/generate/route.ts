import { NextRequest } from 'next/server';
import { generateText } from 'ai';
import { gatewayModel, DEMO_MODEL } from '@/app/lib/ai-gateway';
import { protectAiEndpoint } from '@/app/lib/botid';

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are a UI generator. Output ONLY valid JSON — no markdown, no explanation, no code fences, no text before or after.

The JSON must have this exact structure:
{
  "root": "element-1",
  "elements": {
    "element-1": {
      "type": "ComponentName",
      "props": { ... },
      "children": ["element-2"]
    }
  }
}

AVAILABLE COMPONENTS (use exactly these names):

Card: { title: string, description?: string }
Stack: { direction: "horizontal"|"vertical", gap?: "sm"|"md"|"lg", align?: "center" }
Heading: { level: 1|2|3|4, content: string }
Button: { label: string, variant?: "default"|"outline"|"ghost" }
Badge: { label: string, variant?: "default"|"secondary"|"destructive" }
Input: { placeholder?: string, type?: string }
Metric: { label: string, value: string|number, change?: number }
StatusBadge: { status: "active"|"inactive"|"pending"|"error", label?: string }
CodeBlock: { code: string, language?: string }

RULES:
1. Output ONLY the JSON object, nothing else
2. Use unique IDs for each element (e1, e2, e3...)
3. Use "children" array to nest elements
4. Keep it minimal but complete
5. All string values must be quoted
6. No trailing commas`;

export async function POST(request: NextRequest) {
  // BotID protection — prevent inference theft
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const protection = await protectAiEndpoint(ip);
  if (protection.blocked) {
    return Response.json({ error: protection.reason }, { status: protection.status || 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { prompt } = body as { prompt?: string };

  if (!prompt || typeof prompt !== 'string') {
    return Response.json({ error: 'Prompt required' }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    const { text } = await generateText({
      model: gatewayModel(DEMO_MODEL),
      instructions: SYSTEM_PROMPT,
      prompt: `Generate a UI for: ${prompt}`,
      maxOutputTokens: 1500,
      temperature: 0.3,
    });

    console.log(
      `[json-render] Generated in ${Date.now() - startTime}ms, text length: ${text.length}`
    );

    // Extract JSON from response
    let jsonStr = text.trim();

    // Remove markdown code fences if present
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    // Try to find JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const spec = JSON.parse(jsonStr);

    if (!spec.root || !spec.elements || typeof spec.elements !== 'object') {
      throw new Error('Invalid spec structure');
    }

    return Response.json({ spec });
  } catch (err: any) {
    console.error('[json-render] Generation failed:', err);
    return Response.json(
      {
        error: err?.message || 'Failed to generate spec',
        type: err?.name,
        stack: err?.stack?.split('\n').slice(0, 3),
      },
      { status: 500 }
    );
  }
}
