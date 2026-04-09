import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Plan definitions — ordered cheapest to most expensive
// Matches pricing page: Solo £29, Collective £69, Label £149, Network £499
export const PLANS = {
  solo: {
    price: 29,
    agents: 1,
    models: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash', 'xiaomi/mimo-v2-pro'],
    skills: 3,
    a2aMessages: 100, // per day
  },
  collective: {
    price: 69,
    agents: 3,
    models: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'google/gemini-2.0-flash', 'anthropic/claude-3.5-sonnet', 'xiaomi/mimo-v2-pro'],
    skills: 10,
    a2aMessages: 500,
  },
  label: {
    price: 149,
    agents: 10,
    models: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'openai/gpt-4-turbo', 'google/gemini-2.0-flash', 'anthropic/claude-3.5-sonnet', 'anthropic/claude-3-opus', 'xiaomi/mimo-v2-pro'],
    skills: 25,
    a2aMessages: 2000,
  },
  network: {
    price: 499,
    agents: 100,
    models: ['*'], // all models
    skills: 100,
    a2aMessages: 10000,
  },
} as const;

export type PlanName = keyof typeof PLANS;

// Extend Request to include user plan
declare global {
  namespace Express {
    interface Request {
      userPlan?: PlanName;
      userPlanConfig?: typeof PLANS[PlanName];
    }
  }
}

/**
 * Middleware: Require valid plan
 *
 * Primary: validates subscription against the DB — the header values are
 * cross-referenced so a caller cannot self-upgrade their plan by forging headers.
 * Fallback: if the DB is unavailable, falls back to header + format check so
 * the app stays up during transient DB issues.
 */
export async function requirePlan(req: Request, res: Response, next: NextFunction) {
  const headerPlan = req.headers['x-user-plan'] as PlanName;
  const email = req.headers['x-user-email'] as string;
  const stripeSubscriptionId = req.headers['x-stripe-subscription-id'] as string;

  // Admin bypass — always allow, max plan
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) {
    req.userPlan = 'network';
    req.userPlanConfig = PLANS.network;
    return next();
  }

  // DB validation — cross-reference subscription against the users table.
  // Uses the user's email (already verified by the outer Bearer gate + HMAC) to
  // look up their real plan and subscription ID, so headers can't be forged.
  if (process.env.DATABASE_URL && email) {
    try {
      const { rows } = await pool.query<{ plan: string; stripe_subscription_id: string | null }>(
        `SELECT plan, stripe_subscription_id FROM users WHERE email = $1 LIMIT 1`,
        [email.toLowerCase()]
      );

      if (rows.length > 0 && rows[0].stripe_subscription_id) {
        // User found with a stored subscription — validate it matches the header
        if (rows[0].stripe_subscription_id !== stripeSubscriptionId) {
          return res.status(402).json({
            success: false,
            error: 'Subscription mismatch. Please sign out and back in.',
            code: 'SUBSCRIPTION_MISMATCH',
          });
        }
        // Use plan from DB — not the header — so it can't be self-upgraded
        const dbPlan = (rows[0].plan as PlanName);
        req.userPlan = PLANS[dbPlan] ? dbPlan : 'solo';
        req.userPlanConfig = PLANS[req.userPlan];
        return next();
      }
      // User exists but has no subscription stored — fall through to format check
    } catch (err) {
      // DB unavailable — fall through to header-based check rather than blocking all traffic
      console.error('[requirePlan] DB lookup failed, falling back to header check:', (err as Error).message);
    }
  }

  // Header-based fallback (DB unavailable or user not yet in DB)
  if (!headerPlan || !PLANS[headerPlan]) {
    return res.status(402).json({
      success: false,
      error: 'Valid subscription required. Choose a plan at /pricing',
      code: 'PLAN_REQUIRED',
    });
  }

  if (!stripeSubscriptionId || !/^sub_[a-zA-Z0-9]+$/.test(stripeSubscriptionId)) {
    return res.status(402).json({
      success: false,
      error: 'Active subscription required. Subscribe at /pricing',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }

  req.userPlan = headerPlan;
  req.userPlanConfig = PLANS[headerPlan];
  next();
}

/**
 * Check if user can create another agent
 */
export function checkAgentLimit(currentAgentCount: number, plan: PlanName): boolean {
  return currentAgentCount < PLANS[plan].agents;
}

/**
 * Check if user can access a model
 */
export function canAccessModel(model: string, plan: PlanName): boolean {
  const allowed = PLANS[plan].models;
  return (allowed as readonly string[]).includes('*') || (allowed as readonly string[]).includes(model);
}

/**
 * Check if user has skill quota remaining
 */
export function checkSkillLimit(currentSkillCount: number, plan: PlanName): boolean {
  return currentSkillCount < PLANS[plan].skills;
}
