import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const webhookId = request.nextUrl.searchParams.get('id');
  const body = await request.text();
  const signature = request.headers.get('x-webhook-signature') || '';

  if (!webhookId) {
    return Response.json({ error: 'Missing webhook ID' }, { status: 400 });
  }

  try {
    // Find automations with webhook triggers that have this webhook ID
    const automations = await prisma.automation.findMany({
      where: {
        status: 'active',
        triggers: { path: [], array_contains: { source: 'webhook' } },
      },
    });

    let triggered = false;

    for (const automation of automations) {
      const triggers = automation.triggers as any[];
      const webhookTrigger = triggers.find(
        (t: any) => t.source === 'webhook' && t.id === webhookId
      );
      if (!webhookTrigger) continue;

      // Verify signature if configured. Constant-time compare with a length
      // guard — a plain `!==` leaks the expected HMAC byte-by-byte via timing.
      if (webhookTrigger.secret) {
        const expected =
          'sha256=' + crypto.createHmac('sha256', webhookTrigger.secret).update(body).digest('hex');
        const sigBuf = Buffer.from(signature);
        const expectedBuf = Buffer.from(expected);
        if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
          continue;
        }
      }

      // Check payload filter if configured
      if (webhookTrigger.filter?.regex) {
        const matches = new RegExp(webhookTrigger.filter.regex).test(body);
        if (!matches) continue;
      }

      // Trigger the automation
      let payload: any;
      try {
        payload = JSON.parse(body);
      } catch {
        payload = { raw: body };
      }

      const run = await prisma.automationRun.create({
        data: {
          automationId: automation.id,
          triggerType: 'webhook',
          triggerPayload: payload,
          status: 'running',
        },
      });

      await prisma.automation.update({
        where: { id: automation.id },
        data: { lastFiredAt: new Date(), fireCount: { increment: 1 } },
      });

      triggered = true;
      console.log(`[webhooks/generic] Triggered automation "${automation.name}" (run: ${run.id})`);
    }

    return Response.json({ ok: true, triggered });
  } catch (error) {
    console.error('[webhooks/generic] Error:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
