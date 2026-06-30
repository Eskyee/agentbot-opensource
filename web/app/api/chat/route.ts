/**
 * POST /api/chat — Send a message to Atlas
 *
 * Primary: Routes through the bridge to local OpenClaw (when bridge is online).
 * Fallback: Uses OpenRouter to generate a response (when bridge is offline).
 *
 * Flow:
 * 1. Check if bridge is online
 * 2. If online: route through bridge to local OpenClaw
 * 3. If offline: fallback to cloud AI via OpenRouter
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { pendingRequests, pendingResponses } from '@/app/api/bridge/poll/route';
import { connectedBridges } from '@/app/api/bridge/poll/route';
import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';
import { generateText } from 'ai';
import { gatewayModel } from '@/app/lib/ai-gateway';

const ATLAS_SYSTEM_PROMPT = `You are Atlas — the AI agent for Agentbot. You help users with:

1. **Agent Management** — Deploy, configure, and manage autonomous agents
2. **Platform Navigation** — Guide users through Agentbot features
3. **Technical Support** — Help with setup, debugging, and troubleshooting
4. **Documentation** — Explain how Agentbot works

Key facts:
- Agentbot deploys 24/7 autonomous agents on Telegram, Discord, WhatsApp
- Built on Vercel with Next.js 16
- Uses MiMo-V2.5-Pro as the default AI model
- 5 products: Playground, JSON Render, Coding Agent, Automations, OpenClaw
- Pricing: Solo £29, Collective £69, Label £149

Be helpful, concise, and friendly. Keep responses under 200 words.
If users need help deploying an agent, point them to /playground or /signup.`;

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const messages = body.messages as { role: string; content: string }[] | undefined;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
  }

  // Check if bridge is online
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bridgeSecret: true },
  });

  let bridgeOnline = false;
  if (user?.bridgeSecret) {
    const bridge = connectedBridges.get(user.bridgeSecret);
    bridgeOnline = !!(bridge && Date.now() - bridge.lastSeen < 15_000);
  }

  // If bridge is online, route through bridge
  if (bridgeOnline) {
    return routeThroughBridge(session.user.id, messages);
  }

  // Fallback: Use cloud AI via OpenRouter
  return routeThroughCloud(messages);
}

async function routeThroughBridge(userId: string, messages: { role: string; content: string }[]) {
  const requestId = crypto.randomUUID();

  pendingRequests.set(requestId, {
    requestId,
    userId,
    messages: messages.slice(-20),
    timestamp: Date.now(),
  });

  // Wait for response (poll every 500ms, timeout 30s)
  const timeout = 30_000;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const resp = pendingResponses.get(requestId);
    if (resp && resp.done) {
      pendingResponses.delete(requestId);
      return NextResponse.json({ reply: resp.content, source: 'bridge' });
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  pendingRequests.delete(requestId);
  pendingResponses.delete(requestId);

  // Bridge timed out, fall back to cloud
  return routeThroughCloud(messages);
}

async function routeThroughCloud(messages: { role: string; content: string }[]) {
  try {
    const conversationHistory = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const { text } = await generateText({
      model: gatewayModel(),
      instructions: ATLAS_SYSTEM_PROMPT,
      messages: conversationHistory,
      maxOutputTokens: 500,
      temperature: 0.7,
    });

    const reply = text || 'I encountered an issue processing your request. Please try again.';

    return NextResponse.json({ reply, source: 'cloud' });
  } catch (error) {
    console.error('[chat] Cloud fallback failed:', error);
    return NextResponse.json({
      reply:
        "I'm having trouble connecting right now. Please try again in a moment, or check out our documentation at agentbot.sh/docs for help.",
      source: 'cloud',
      error: true,
    });
  }
}
