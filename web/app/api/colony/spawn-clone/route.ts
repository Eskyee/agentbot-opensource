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

export async function POST() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = await checkUserRateLimit('colony:spawn-clone', session.user.id, 3, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit: max 3 spawns/hour', retryAfter: rl.retryAfter },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const queenUrl = await resolveSoulUrlFast(null);
  const cloneUrl = `${queenUrl}/clone`;

  const privateKey = process.env.TEMPO_CLONE_WALLET_PRIVATE_KEY?.trim();

  // Inspect mode — no wallet configured. Return the 402 for manual payment.
  if (!privateKey || !privateKey.startsWith('0x')) {
    try {
      const res = await fetch(cloneUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const challenge = await res.json().catch(() => null);
      return NextResponse.json({
        mode: 'manual',
        cloneUrl,
        challenge,
        instructions: 'Configure TEMPO_CLONE_WALLET_PRIVATE_KEY in Vercel env to enable auto-spawn. Or pay manually using the challenge details above.',
      }, { status: 402 });
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
