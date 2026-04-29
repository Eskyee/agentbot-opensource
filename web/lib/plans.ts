export type PlanId = 'free' | 'solo' | 'collective' | 'label' | 'network';

export type PlanConfig = {
  id: PlanId;
  name: string;
  priceGbpMonthly: number;
  stripePrice?: string;
  maxAgents: number;
  maxDeployments: number;
  monthlyExecutions: number;
  features: string[];
};

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    priceGbpMonthly: 0,
    maxAgents: 0,
    maxDeployments: 0,
    monthlyExecutions: 0,
    features: ['No active paid capacity'],
  },
  solo: {
    id: 'solo',
    name: 'Solo',
    priceGbpMonthly: 29,
    stripePrice: process.env.STRIPE_PRICE_SOLO,
    maxAgents: 1,
    maxDeployments: 1,
    monthlyExecutions: 1_000,
    features: ['1 Creative Agent thread', 'Audience engagement', 'Opportunity discovery', 'BYOK supported'],
  },
  collective: {
    id: 'collective',
    name: 'Collective',
    priceGbpMonthly: 69,
    stripePrice: process.env.STRIPE_PRICE_COLLECTIVE,
    maxAgents: 3,
    maxDeployments: 3,
    monthlyExecutions: 5_000,
    features: ['3 Creative Agent threads', 'OpenClaw Business seat', 'Email triage', 'BYOK supported'],
  },
  label: {
    id: 'label',
    name: 'Label',
    priceGbpMonthly: 149,
    stripePrice: process.env.STRIPE_PRICE_LABEL,
    maxAgents: 10,
    maxDeployments: 10,
    monthlyExecutions: 20_000,
    features: ['10 Creative Agent threads', 'Multi-inbox', 'White-label emails', 'Analytics'],
  },
  network: {
    id: 'network',
    name: 'Network',
    priceGbpMonthly: 499,
    stripePrice: process.env.STRIPE_PRICE_NETWORK,
    maxAgents: 50,
    maxDeployments: 25,
    monthlyExecutions: 100_000,
    features: ['High-capacity orchestration', 'White-label / resale', 'Priority queue', 'SLA path'],
  },
};

export function normalizePlan(plan?: string | null): PlanId {
  const value = (plan || '').toLowerCase();
  if (value === 'starter' || value === 'underground') return 'solo';
  if (value === 'pro') return 'collective';
  if (value === 'scale' || value === 'enterprise' || value === 'white_glove') return 'label';
  if (value === 'solo' || value === 'collective' || value === 'label' || value === 'network') return value as PlanId;
  return 'free';
}
