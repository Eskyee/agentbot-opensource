// Pricing tiers for AgentBot
export const PRICING_TIERS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 19,
    currency: 'GBP',
    period: 'month',
    description: 'Perfect for individuals',
    features: [
      '1 AI Agent',
      '2GB RAM, 1 CPU',
      '10GB storage',
      'Telegram channel',
      'Use your own AI key',
    ],
    limits: {
      agents: 1,
      ram: 2,
      cpu: 1,
      storage: 10,
      channels: ['telegram'],
    },
    stripeProductId: process.env.STRIPE_PRODUCT_STARTER,
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 39,
    currency: 'GBP',
    period: 'month',
    description: 'For power users',
    features: [
      '1 AI Agent',
      '4GB RAM, 2 CPU',
      '50GB storage',
      'Telegram + WhatsApp',
      'Custom domain',
      'Usage-based pricing',
    ],
    limits: {
      agents: 1,
      ram: 4,
      cpu: 2,
      storage: 50,
      channels: ['telegram', 'whatsapp'],
      customDomain: true,
    },
    stripeProductId: process.env.STRIPE_PRODUCT_PRO,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    price: 79,
    currency: 'GBP',
    period: 'month',
    description: 'For growing teams',
    features: [
      '3 AI Agents',
      '8GB RAM, 4 CPU',
      '100GB storage',
      'All channels',
      'Advanced analytics',
    ],
    limits: {
      agents: 3,
      ram: 8,
      cpu: 4,
      storage: 100,
      channels: ['telegram', 'whatsapp', 'discord'],
      analytics: true,
    },
    stripeProductId: process.env.STRIPE_PRODUCT_SCALE,
    stripePriceId: process.env.STRIPE_PRICE_SCALE,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 149,
    currency: 'GBP',
    period: 'month',
    description: 'Full service solution',
    features: [
      'Unlimited agents',
      '16GB RAM, 4 CPU',
      '500GB storage',
      'White-label options',
      '24/7 phone support',
    ],
    limits: {
      agents: -1, // Unlimited
      ram: 16,
      cpu: 4,
      storage: 500,
      channels: ['telegram', 'whatsapp', 'discord', 'twitter'],
      whiteLabelOption: true,
      support: '24/7 phone',
    },
    stripeProductId: process.env.STRIPE_PRODUCT_ENTERPRISE,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
  },
  whiteglove: {
    id: 'whiteglove',
    name: 'White Glove',
    price: 199,
    currency: 'GBP',
    period: 'month',
    description: 'Premium solution',
    features: [
      'Everything in Enterprise',
      '10x resources',
      'Dedicated account manager',
      'Priority 24/7 support',
      'Custom SLA',
    ],
    limits: {
      agents: -1, // Unlimited
      ram: 160,
      cpu: 40,
      storage: 5000,
      channels: ['telegram', 'whatsapp', 'discord', 'twitter', 'custom'],
      dedicatedManager: true,
      support: 'Priority 24/7',
      customSLA: true,
    },
    stripeProductId: process.env.STRIPE_PRODUCT_WHITEGLOVE,
    stripePriceId: process.env.STRIPE_PRICE_WHITEGLOVE,
  },
}

export const TIER_ORDER = ['starter', 'pro', 'scale', 'enterprise', 'whiteglove']

export function getTier(tierId: string) {
  return PRICING_TIERS[tierId as keyof typeof PRICING_TIERS]
}

export function getTierByProductId(productId: string) {
  return Object.values(PRICING_TIERS).find(tier => tier.stripeProductId === productId)
}

export function checkTierLimits(tier: typeof PRICING_TIERS.starter, currentUsage: any) {
  const errors: string[] = []

  if (tier.limits.agents > 0 && currentUsage.agents >= tier.limits.agents) {
    errors.push(`Agent limit reached (${tier.limits.agents})`)
  }

  if (currentUsage.storage > tier.limits.storage) {
    errors.push(`Storage limit exceeded (${tier.limits.storage}GB)`)
  }

  return { allowed: errors.length === 0, errors }
}
