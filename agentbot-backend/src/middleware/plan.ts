import { Request, Response, NextFunction } from 'express';

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
    agents: 10,
    models: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'google/gemini-2.0-flash', 'anthropic/claude-3.5-sonnet', 'xiaomi/mimo-v2-pro'],
    skills: 10,
    a2aMessages: 500,
  },
  label: {
    price: 149,
    agents: 3,
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
 * Reads Stripe subscription status from trusted frontend headers.
 *
 * SECURITY NOTE: x-user-plan and x-stripe-subscription-id are trusted headers
 * set by the Next.js frontend after verifying the user's Stripe subscription.
 * These values are NOT cryptographically verified here — trust depends on the
 * outer Bearer-token gate (index.ts) preventing direct external access.
 *
 * TODO: For stronger guarantees, validate stripeSubscriptionId directly against
 * the Stripe API or a local DB cache rather than trusting the header value.
 */
export function requirePlan(req: Request, res: Response, next: NextFunction) {
  const plan = req.headers['x-user-plan'] as PlanName;
  const email = req.headers['x-user-email'] as string;
  const stripeSubscriptionId = req.headers['x-stripe-subscription-id'] as string;

  // Admin bypass
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  if (email && ADMIN_EMAILS.includes(email)) {
    req.userPlan = 'network'; // admins get max plan
    req.userPlanConfig = PLANS.network;
    return next();
  }

  // Must have a valid plan name
  if (!plan || !PLANS[plan]) {
    return res.status(402).json({
      success: false,
      error: 'Valid subscription required. Choose a plan at /pricing',
      code: 'PLAN_REQUIRED',
    });
  }

  // Must have Stripe subscription — validate basic format (sub_xxx)
  if (!stripeSubscriptionId || !/^sub_[a-zA-Z0-9]+$/.test(stripeSubscriptionId)) {
    return res.status(402).json({
      success: false,
      error: 'Active subscription required. Subscribe at /pricing',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }

  req.userPlan = plan;
  req.userPlanConfig = PLANS[plan];
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
