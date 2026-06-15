/**
 * SSE stream — pushes soul status, diagnostics, and wallet updates to the
 * Borg dashboard. Single in-flight poll (no overlap), 15s heartbeat keeps
 * proxies happy, 55s self-close so EventSource auto-reconnects.
 */

import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { resolveSoulUrlFast, makeSoul } from '../_shared';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SOUL_INTERVAL_MS = 5_000;
const DIAG_INTERVAL_MS = 30_000;
const HEARTBEAT_MS = 15_000;
const STREAM_LIFETIME_MS = 55_000;

function enc(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function encComment(text: string): Uint8Array {
  return new TextEncoder().encode(`: ${text}\n\n`);
}

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  let userUrl: string | null = null;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { openclawUrl: true },
    });
    userUrl = dbUser?.openclawUrl ?? null;
  } catch { /* non-fatal */ }

  const soulUrl = await resolveSoulUrlFast(userUrl);
  const soul = makeSoul(soulUrl, 8000);

  let closed = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const cleanup = () => {
    closed = true;
    for (const t of timers) clearTimeout(t);
    timers.length = 0;
  };
  request.signal.addEventListener('abort', cleanup);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try { controller.enqueue(enc(event, data)); } catch { cleanup(); }
      };
      const heartbeat = () => {
        if (closed) return;
        try { controller.enqueue(encComment('keepalive')); } catch { cleanup(); }
      };

      send('meta', { soulUrl });

      // Recursive single-in-flight poller — no overlap possible.
      const pollSoul = async () => {
        if (closed) return;
        try {
          const status = await soul.getStatus();
          send('soul', status);
        } catch (e: any) {
          send('error', { source: 'soul', message: e.message });
        }
        if (closed) return;
        timers.push(setTimeout(pollSoul, SOUL_INTERVAL_MS));
      };

      const pollDiagnostics = async () => {
        if (closed) return;
        try {
          const diag = await soul.getDiagnostics();
          send('diagnostics', diag);
        } catch (e: any) {
          send('error', { source: 'diagnostics', message: e.message });
        }
        if (closed) return;
        timers.push(setTimeout(pollDiagnostics, DIAG_INTERVAL_MS));
      };

      // Heartbeat — runs even when soul is failing so proxies don't drop us.
      const beat = () => {
        if (closed) return;
        heartbeat();
        timers.push(setTimeout(beat, HEARTBEAT_MS));
      };

      // Kick off all three loops in parallel.
      pollSoul();
      pollDiagnostics();
      timers.push(setTimeout(beat, HEARTBEAT_MS));

      // Hard close before Vercel maxDuration.
      timers.push(setTimeout(() => {
        cleanup();
        try { controller.close(); } catch {}
      }, STREAM_LIFETIME_MS));
    },
    cancel() { cleanup(); },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  });
}
