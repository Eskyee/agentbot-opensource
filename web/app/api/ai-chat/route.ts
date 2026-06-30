import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { gatewayModel } from '@/app/lib/ai-gateway';

const SYSTEM_PROMPT = `You are Atlas, the AI assistant for Agentbot (agentbot.sh). You help users with their agents, troubleshooting, billing, and platform questions.

PERSONALITY:
- Friendly, concise, helpful
- Use bullet points for multi-step instructions
- If you don't know something, say so and suggest contacting support@agentbot.sh
- Keep responses under 300 words unless the question requires more

KNOWLEDGE:
- Agentbot deploys autonomous AI agents that run 24/7 on OpenClaw
- Plans: Free (BYOK), Solo £29/mo, Collective £69/mo, Label £149/mo, Network £499/mo
- Channels: Telegram, Discord, WhatsApp, X
- Stack: Next.js, Prisma + PostgreSQL, Base L2
- Docs: agentbot.sh/documentation
- Support: support@agentbot.sh`;

export async function POST(request: Request): Promise<Response> {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: gatewayModel(),
    instructions: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    maxOutputTokens: 800,
    temperature: 0.7,
  });

  return result.toUIMessageStreamResponse();
}
