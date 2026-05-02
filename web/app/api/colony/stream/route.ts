/**
 * SSE stream — pushes soul status updates to the Borg dashboard every 5s.
 * Client reconnects automatically (EventSource spec) when the 55s window closes.
 */

import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { SoulClient } from '@/lib/soul';
import { DEFAULT_SOUL_SERVICE_URL } from '@/app/lib/openclaw-config';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BORG_0_URL = 'https://borg-0-production-7139.up.railway.app';

async function resolveSoulUrl(userUrl: string | null): Promise<string> {
  const candidates = [...new Set(
    [userUrl, DEFAULT_SOUL_SERVICE_URL, BORG_0_URL].filter(Boolean) as string[]
  )];
  for (const url of candidates) {
    try {
      const res = await fetch(`${url}/health`, {
        signal: AbortSignal.timeout(3000),
        cache: 'no-store',
      });
      if (res.ok) return url;
    } catch { /* try next */ }
  }
  return candidates[0];
}

function enc(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
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

  const soulUrl = await resolveSoulUrl(userUrl);
  const soul = new SoulClient(soulUrl, 8000);

  let closed = false;
  request.signal.addEventListener('abort', () => { closed = true; });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try { controller.enqueue(enc(event, data)); } catch { closed = true; }
      };

      // Send source URL so client can surface it
      send('meta', { soulUrl });

      const poll = async () => {
        if (closed) return;
        try {
          const status = await soul.getStatus();
          send('soul', status);
        } catch (e: any) {
          send('error', { message: e.message });
        }
      };

      await poll();

      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); try { controller.close(); } catch {} return; }
        await poll();
      }, 5_000);

      // Close before Vercel maxDuration so the client gets a clean EOF + reconnects
      setTimeout(() => {
        clearInterval(interval);
        closed = true;
        try { controller.close(); } catch {}
      }, 55_000);
    },
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
