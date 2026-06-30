import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';

export const maxDuration = 300;

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '';

/**
 * Verify a Slack request signature.
 * basestring = `v0:${timestamp}:${rawBody}`, signed with the signing secret.
 * Slack signs every request (including url_verification); the timestamp is in
 * Unix seconds — reject anything older than 5 minutes to prevent replay.
 */
function verifySlackSignature(rawBody: string, timestamp: string, signature: string): boolean {
  if (!SLACK_SIGNING_SECRET) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const expected =
    'v0=' + crypto.createHmac('sha256', SLACK_SIGNING_SECRET).update(`v0:${timestamp}:${rawBody}`).digest('hex');
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch — guard first.
  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export async function POST(request: NextRequest) {
  // Fail CLOSED: without a signing secret we cannot authenticate Slack, and
  // this endpoint triggers user automations. Previously there was NO
  // verification at all — any forged event fired automations.
  if (!SLACK_SIGNING_SECRET) {
    console.error('[webhooks/slack] SLACK_SIGNING_SECRET not configured — rejecting');
    return Response.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const timestamp = request.headers.get('x-slack-request-timestamp') || '';
  const signature = request.headers.get('x-slack-signature') || '';

  if (!verifySlackSignature(rawBody, timestamp, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Handle Slack URL verification challenge
  if (payload.type === 'url_verification') {
    return Response.json({ challenge: payload.challenge });
  }

  const eventType = payload.event?.type;
  const channel = payload.event?.channel;

  try {
    // Find automations with Slack triggers
    const automations = await prisma.automation.findMany({
      where: {
        status: 'active',
        triggers: { path: [], array_contains: { source: 'slack' } },
      },
    });

    for (const automation of automations) {
      const triggers = automation.triggers as any[];
      const slackTrigger = triggers.find((t: any) => t.source === 'slack');
      if (!slackTrigger) continue;

      // Check event type match
      const eventMatch =
        slackTrigger.event === 'all' ||
        (slackTrigger.event === 'message' && eventType === 'message') ||
        (slackTrigger.event === 'reaction' && eventType === 'reaction_added');

      if (!eventMatch) continue;

      // Check channel filter
      if (slackTrigger.channel && channel !== slackTrigger.channel) continue;

      // Trigger the automation
      const run = await prisma.automationRun.create({
        data: {
          automationId: automation.id,
          triggerType: 'slack',
          triggerPayload: payload,
          status: 'running',
        },
      });

      await prisma.automation.update({
        where: { id: automation.id },
        data: { lastFiredAt: new Date(), fireCount: { increment: 1 } },
      });

      console.log(`[webhooks/slack] Triggered automation "${automation.name}" (run: ${run.id})`);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[webhooks/slack] Error:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
