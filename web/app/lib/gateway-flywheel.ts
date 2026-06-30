/**
 * Gateway data flywheel — make `model:auto` learn from real traffic.
 *
 * Every auto-routed request is a labelled datapoint: for this *shape* of request
 * (difficulty bucket), this model either served it well or got escalated past.
 * We accumulate those outcomes in durable Redis counters and feed them back into
 * the ladder order, so the routing gets smarter the more it's used. A fork can
 * copy the code but not the accumulated outcomes — that's the moat.
 *
 * Storage (durable, no TTL):
 *   gw:fly:<bucket>   hash, per candidate model:
 *     <model>#att  attempts (times this model was the served pick)
 *     <model>#ok   successes
 *     <model>#esc  total escalations that happened before a success in this bucket
 *     <model>#lat  summed latency ms (for averages)
 *   gw:fly:savings   hash: microUsdSaved, requests   (vs always-premium)
 *
 * Latency-safe: the learned reorder is a single hgetall with a short in-process
 * cache; recording is fire-and-forget. Everything fails open to the static ladder.
 */
import { redis } from './redis';

export type Bucket = 'low' | 'med' | 'high';

/** Premium (top-of-ladder) USD per 1M output tokens, for savings math. */
const PREMIUM_PER_1M = 15;
/** Per-model USD per 1M output tokens (mirror of gateway-router LADDER). */
const RATE_PER_1M: Record<string, number> = {
  'xiaomi/mimo-v2-flash': 0.336,
  'xiaomi/mimo-v2.5': 0.336,
  'xiaomi/mimo-v2.5-pro': 1.044,
  'google/gemini-2.5-flash': 1.8,
  'sakana/fugu-ultra': 12,
  'anthropic/claude-sonnet-4.5': 15,
};

/** Minimum attempts in a bucket/model before its success rate steers ordering. */
const MIN_SIGNAL = 20;

export function bucketFor(difficulty: number): Bucket {
  if (difficulty < 34) return 'low';
  if (difficulty < 67) return 'med';
  return 'high';
}

function key(bucket: Bucket): string {
  return `gw:fly:${bucket}`;
}

// ---- in-memory fallback (dev/preview) -----------------------------------
type Counters = Record<string, number>;
const mem = new Map<string, Counters>();
const memSavings = { microUsdSaved: 0, requests: 0 };

function memBump(k: string, field: string, by: number) {
  const c = mem.get(k) ?? {};
  c[field] = (c[field] ?? 0) + by;
  mem.set(k, c);
}

// ---- recording ----------------------------------------------------------
export type RoutingOutcome = {
  bucket: Bucket;
  /** the ladder id that ultimately served (or last tried on failure) */
  model: string;
  success: boolean;
  /** how many cheaper models were escalated past before this one served */
  escalations: number;
  latencyMs: number;
  /** output tokens, for savings vs premium (0 for streaming) */
  outputTokens?: number;
};

export async function recordRouting(o: RoutingOutcome): Promise<void> {
  const k = key(o.bucket);
  const m = o.model;
  const savedMicroUsd =
    o.success && o.outputTokens && RATE_PER_1M[m] !== undefined && m !== topModel()
      ? Math.max(0, Math.round(((PREMIUM_PER_1M - RATE_PER_1M[m]) * o.outputTokens) / 1)) // micro-usd ≈ (Δrate per 1M) * tokens
      : 0;

  if (redis) {
    try {
      const p = redis.pipeline();
      p.hincrby(k, `${m}#att`, 1);
      if (o.success) p.hincrby(k, `${m}#ok`, 1);
      if (o.escalations) p.hincrby(k, `${m}#esc`, o.escalations);
      if (o.latencyMs) p.hincrby(k, `${m}#lat`, Math.round(o.latencyMs));
      p.hincrby('gw:fly:savings', 'requests', 1);
      if (savedMicroUsd) p.hincrby('gw:fly:savings', 'microUsdSaved', savedMicroUsd);
      await p.exec();
      return;
    } catch {
      /* fall through to memory */
    }
  }
  memBump(k, `${m}#att`, 1);
  if (o.success) memBump(k, `${m}#ok`, 1);
  if (o.escalations) memBump(k, `${m}#esc`, o.escalations);
  if (o.latencyMs) memBump(k, `${m}#lat`, Math.round(o.latencyMs));
  memSavings.requests += 1;
  memSavings.microUsdSaved += savedMicroUsd;
}

function topModel(): string {
  // The most expensive known model = the "premium" baseline.
  return 'anthropic/claude-sonnet-4.5';
}

// ---- learning -----------------------------------------------------------
type CacheEntry = { at: number; counters: Counters };
const learnCache = new Map<string, CacheEntry>();
const LEARN_TTL_MS = 30_000;

async function readBucket(bucket: Bucket): Promise<Counters> {
  const cached = learnCache.get(bucket);
  if (cached && Date.now() - cached.at < LEARN_TTL_MS) return cached.counters;

  let counters: Counters = {};
  if (redis) {
    try {
      const h = (await redis.hgetall<Record<string, string | number>>(key(bucket))) ?? {};
      for (const [f, v] of Object.entries(h)) counters[f] = Number(v) || 0;
    } catch {
      counters = mem.get(key(bucket)) ?? {};
    }
  } else {
    counters = mem.get(key(bucket)) ?? {};
  }
  learnCache.set(bucket, { at: Date.now(), counters });
  return counters;
}

function successRate(counters: Counters, model: string): number | null {
  const att = counters[`${model}#att`] ?? 0;
  if (att < MIN_SIGNAL) return null;
  const ok = counters[`${model}#ok`] ?? 0;
  return ok / att;
}

/**
 * Reorder the candidate ladder so the model with the best *observed* success
 * rate in this bucket goes first — but only once it has enough signal. Models
 * without enough data keep their static (cost-ordered) position. Fails open.
 */
export async function applyLearnedOrder(bucket: Bucket, candidates: string[]): Promise<string[]> {
  if (candidates.length < 2) return candidates;
  let counters: Counters;
  try {
    counters = await readBucket(bucket);
  } catch {
    return candidates;
  }

  const withSignal = candidates
    .map((id, idx) => ({ id, idx, rate: successRate(counters, id) }))
    .filter((c) => c.rate !== null) as { id: string; idx: number; rate: number }[];
  if (withSignal.length < 1) return candidates;

  // Best observed model first; everything else keeps original cost order.
  const best = withSignal.sort((a, b) => b.rate - a.rate)[0];
  if (best.idx === 0) return candidates; // already first
  const reordered = [best.id, ...candidates.filter((id) => id !== best.id)];
  return reordered;
}

// ---- stats (for the trust page) ----------------------------------------
export type ModelStat = {
  model: string;
  attempts: number;
  successRate: number;
  avgLatencyMs: number;
};
export type FlywheelStats = {
  totalRouted: number;
  overallSuccessRate: number;
  estimatedUsdSaved: number;
  byBucket: Record<Bucket, { routed: number; best: string | null }>;
  topModels: ModelStat[];
};

export async function getFlywheelStats(): Promise<FlywheelStats> {
  const buckets: Bucket[] = ['low', 'med', 'high'];
  const perBucket = await Promise.all(buckets.map(readBucket));

  const agg = new Map<string, { att: number; ok: number; lat: number }>();
  const byBucket = {} as FlywheelStats['byBucket'];
  let totalRouted = 0;
  let totalOk = 0;

  buckets.forEach((b, i) => {
    const c = perBucket[i];
    let routed = 0;
    let best: string | null = null;
    let bestRate = -1;
    for (const [field, val] of Object.entries(c)) {
      const [model, kind] = field.split('#');
      if (!model || !kind) continue;
      const cur = agg.get(model) ?? { att: 0, ok: 0, lat: 0 };
      if (kind === 'att') {
        cur.att += val;
        routed += val;
        totalRouted += val;
      } else if (kind === 'ok') {
        cur.ok += val;
        totalOk += val;
      } else if (kind === 'lat') {
        cur.lat += val;
      }
      agg.set(model, cur);
    }
    // best model in this bucket by success rate (min signal)
    const models = new Set(Object.keys(c).map((f) => f.split('#')[0]));
    for (const m of models) {
      const att = c[`${m}#att`] ?? 0;
      if (att < MIN_SIGNAL) continue;
      const rate = (c[`${m}#ok`] ?? 0) / att;
      if (rate > bestRate) {
        bestRate = rate;
        best = m;
      }
    }
    byBucket[b] = { routed, best };
  });

  const topModels: ModelStat[] = Array.from(agg.entries())
    .map(([model, v]) => ({
      model,
      attempts: v.att,
      successRate: v.att ? v.ok / v.att : 0,
      avgLatencyMs: v.att ? Math.round(v.lat / v.att) : 0,
    }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 6);

  let microUsdSaved = 0;
  if (redis) {
    try {
      const s = (await redis.hgetall<Record<string, string | number>>('gw:fly:savings')) ?? {};
      microUsdSaved = Number(s.microUsdSaved) || 0;
    } catch {
      microUsdSaved = memSavings.microUsdSaved;
    }
  } else {
    microUsdSaved = memSavings.microUsdSaved;
  }

  return {
    totalRouted,
    overallSuccessRate: totalRouted ? totalOk / totalRouted : 0,
    // microUsd here ≈ (Δrate per 1M tokens) × tokens; ÷1e6 → USD.
    estimatedUsdSaved: microUsdSaved / 1_000_000,
    byBucket,
    topModels,
  };
}
