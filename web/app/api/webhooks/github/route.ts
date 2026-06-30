import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';

export const maxDuration = 300;

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch — guard first (a crafted
  // short/long signature must return false, not 500).
  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-hub-signature-256') || '';
  const event = request.headers.get('x-github-event') || '';
  const secret = process.env.GITHUB_WEBHOOK_SECRET || '';

  // Fail CLOSED: without a configured secret we cannot authenticate the sender,
  // and this endpoint triggers user automations. Previously an unset secret
  // skipped verification entirely (anyone could forge events).
  if (!secret) {
    console.error('[webhooks/github] GITHUB_WEBHOOK_SECRET not configured — rejecting');
    return Response.json({ error: 'Webhook not configured' }, { status: 503 });
  }
  if (!verifySignature(body, signature, secret)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const repository = payload.repository?.full_name;

  try {
    // Find automations that have GitHub triggers for this repo
    const automations = await prisma.automation.findMany({
      where: {
        status: 'active',
        triggers: { path: [], array_contains: { source: 'github' } },
      },
    });

    for (const automation of automations) {
      const triggers = automation.triggers as any[];
      const githubTrigger = triggers.find((t: any) => t.source === 'github');
      if (!githubTrigger) continue;

      // Check if event matches trigger
      const eventMatch =
        githubTrigger.event === 'all' ||
        event === githubTrigger.event ||
        (githubTrigger.event === 'pull_request' && event === 'pull_request') ||
        (githubTrigger.event === 'push' && event === 'push') ||
        (githubTrigger.event === 'issues' && event === 'issues') ||
        (githubTrigger.event === 'issue_comment' && event === 'issue_comment');

      if (!eventMatch) continue;

      // Check filter conditions
      const filter = githubTrigger.filter || {};
      if (filter.repository && repository !== filter.repository) continue;
      if (filter.startsWith && event === 'issue_comment') {
        const comment = payload.comment?.body || '';
        if (!comment.startsWith(filter.startsWith)) continue;
      }

      // Trigger the automation
      const action = automation.action as any;
      const run = await prisma.automationRun.create({
        data: {
          automationId: automation.id,
          triggerType: 'github',
          triggerPayload: payload,
          status: 'running',
        },
      });

      await prisma.automation.update({
        where: { id: automation.id },
        data: { lastFiredAt: new Date(), fireCount: { increment: 1 } },
      });

      console.log(`[webhooks/github] Triggered automation "${automation.name}" (run: ${run.id})`);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[webhooks/github] Error:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
