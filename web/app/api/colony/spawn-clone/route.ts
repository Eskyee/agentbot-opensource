/**
 * POST /api/colony/spawn-clone
 *
 * Pays the queen's /clone endpoint with $1 pathUSD via x402 tempo-tip20 and
 * returns the resulting clone metadata.
 *
 * Modes:
 *   1. Auto-pay  — TEMPO_CLONE_WALLET_PRIVATE_KEY is set → server signs and submits
 *   2. Inspect   — env var missing → returns the 402 challenge so the dashboard
 *                  can render a manual-payment prompt
 *
 * Auth: requires session. Rate limit: 3 spawns / hour / user.
 */

import { NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { checkUserRateLimit } from '@/lib/rate-limit-user';
import { payX402TempoTip20 } from '@/lib/tempo-tip20-pay';
import { resolveSoulUrlFast } from '../_shared';

export const runtime = 'nodejs';
export const maxDuration = 90;

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const inspectOnly = searchParams.get('inspect') === '1';

  // Inspect requests skip the rate limit (read-only, no funds).
  if (!inspectOnly) {
    const rl = await checkUserRateLimit('colony:spawn-clone', session.user.id, 3, 3600);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit: max 3 spawns/hour', retryAfter: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }
  }

  const queenUrl = await resolveSoulUrlFast(null);
  const cloneUrl = `${queenUrl}/clone`;

  const privateKey = process.env.TEMPO_CLONE_WALLET_PRIVATE_KEY?.trim();

  // Inspect mode — explicit request OR no wallet configured. Return the 402 for review/manual payment.
  if (inspectOnly || !privateKey || !privateKey.startsWith('0x')) {
    try {
      const res = await fetch(cloneUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const challenge = await res.json().catch(() => null);
      const walletConfigured = Boolean(privateKey && privateKey.startsWith('0x'));
      return NextResponse.json({
        mode: inspectOnly ? 'inspect' : 'manual',
        cloneUrl,
        challenge,
        walletConfigured,
        instructions: walletConfigured
          ? 'Auto-pay is configured. Click Spawn Worker to debit the server wallet.'
          : 'Configure TEMPO_CLONE_WALLET_PRIVATE_KEY in Vercel env to enable auto-spawn, or pay manually using these details.',
      }, { status: inspectOnly ? 200 : 402 });
    } catch (e: any) {
      return NextResponse.json({ error: 'Queen unreachable', detail: e?.message }, { status: 502 });
    }
  }

  // Auto-pay mode.
  try {
    const result = await payX402TempoTip20(cloneUrl, privateKey as `0x${string}`);
    if (!result.ok) {
      console.error('[spawn-clone] payment failed:', result);
      return NextResponse.json(
        { error: 'Clone payment failed', detail: result.error, status: result.status, queenResponse: result.body },
        { status: 502 },
      );
    }
    return NextResponse.json({
      mode: 'paid',
      cloneUrl,
      receipt: result.receipt,
      clone: result.body,
    });
  } catch (e: any) {
    console.error('[spawn-clone] exception:', e);
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
