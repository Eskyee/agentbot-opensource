// Agentbot Pricing - Dual Agent Architecture
// Agentbot = Creative Crew, OpenClaw = Business Operations

export const PRICING_TIERS = {
  solo: {
    id: 'solo',
    name: 'Solo',
    price: 29,
    currency: 'GBP',
    period: 'month',
    description: 'For bedroom producers',
    features: [
      '1 Creative Agent thread',
      'Audience engagement (Telegram)',
      'Opportunity discovery',
      'Use your own AI key',
    ],
    limits: {
      agents: 1,
      threads: 1,
      openclowSeats: 0,
      ram: 2,
      cpu: 1,
      storage: 10,
      channels: ['telegram'],
      emailProcessing: 0,
      documentPages: 0,
      scrapingJobs: 0,
    },
    stripeProductId: process.env.STRIPE_PRODUCT_SOLO,
    stripePriceId: process.env.STRIPE_PRICE_SOLO,
  },
  collective: {
    id: 'collective',
    name: 'Collective',
    price: 69,
    currency: 'GBP',
    period: 'month',
    description: 'DJs with day jobs - first step to autonomy',
    features: [
      '3 Creative Agent threads',
      '1 OpenClaw Business seat (Tour Manager)',
      'Priority queue',
      'Email Triage (50/day)',
      'Calendar Guard',
      'Simple Scraping (3 sites)',
      'PDF Contract Reading (50 pages/day)',
      'x402 USDC Invoicing',
      'Telegram + WhatsApp',
    ],
    limits: {
      agents: 3,
      threads: 3,
      openclowSeats: 1,
      ram: 4,
      cpu: 2,
      storage: 50,
      channels: ['telegram', 'whatsapp'],
      emailProcessing: 50,
      documentPages: 50,
      scrapingJobs: 3,
    },
    stripeProductId: process.env.STRIPE_PRODUCT_COLLECTIVE,
    stripePriceId: process.env.STRIPE_PRICE_COLLECTIVE,
  },
  label: {
    id: 'label',
    name: 'Label',
    price: 149,
    currency: 'GBP',
    period: 'month',
    description: 'Indie labels - full infrastructure',
    features: [
      '10 Creative Agent threads',
      '3 OpenClaw Business seats',
      'Dedicated 4vCPU container',
      'Multi-inbox (A&R@, Booking@, Press@)',
      'Rider Analysis & Comparison',
      'Lead Qualification (Resident Advisor, Songkick)',
      'Contract Lifecycle Management',
      'Bankr Integration (tour budget, stablecoins)',
      'Email Processing (500/day)',
      'Unlimited Scraping',
      'White-label emails (@yourlabel.com)',
      'All channels',
    ],
    limits: {
      agents: 10,
      threads: 10,
      openclowSeats: 3,
      ram: 8,
      cpu: 4,
      storage: 100,
      channels: ['telegram', 'whatsapp', 'discord'],
      emailProcessing: 500,
      documentPages: 500,
      scrapingJobs: -1, // Unlimited
      whiteLabel: true,
    },
    stripeProductId: process.env.STRIPE_PRODUCT_LABEL,
    stripePriceId: process.env.STRIPE_PRICE_LABEL,
  },
  network: {
    id: 'network',
    name: 'Network',
    price: 499,
    currency: 'GBP',
    period: 'month',
    description: 'Agencies - resell the future',
    features: [
      'Unlimited Creative Agents',
      'Unlimited OpenClaw Business seats',
      'Dedicated 16GB VM',
      'Full white-label (clients see "Managed by [Agency] AI")',
      'Sub-accounts (resell at your markup)',
      'Custom vertical scrapers',
      'SLA guarantees (99.9% uptime)',
      'Unlimited everything',
      'Dedicated proxy pool',
      'Crew Coordination (A2A Bus)',
    ],
    limits: {
      agents: -1, // Unlimited
      threads: -1, // Unlimited
      openclowSeats: -1, // Unlimited
      ram: 16,
      cpu: 8,
      storage: 500,
      channels: ['telegram', 'whatsapp', 'discord', 'twitter', 'custom'],
      emailProcessing: -1, // Unlimited
      documentPages: -1, // Unlimited
      scrapingJobs: -1, // Unlimited
      whiteLabel: true,
      customScrapers: true,
      sla: '99.9%',
      dedicatedProxy: true,
    },
    stripeProductId: process.env.STRIPE_PRODUCT_NETWORK,
    stripePriceId: process.env.STRIPE_PRICE_NETWORK,
  },
}

export const TIER_ORDER = ['solo', 'collective', 'label', 'network']

export function getTier(tierId: string) {
  return PRICING_TIERS[tierId as keyof typeof PRICING_TIERS]
}

export function getTierByProductId(productId: string) {
  return Object.values(PRICING_TIERS).find(tier => tier.stripeProductId === productId)
}

export function checkTierLimits(tier: typeof PRICING_TIERS.solo, currentUsage: any) {
  const errors: string[] = []

  if (tier.limits.threads > 0 && currentUsage.threads >= tier.limits.threads) {
    errors.push(`Thread limit reached (${tier.limits.threads})`)
  }

  if (tier.limits.openclowSeats >= 0 && currentUsage.openclowSeats > tier.limits.openclowSeats) {
    errors.push(`OpenClaw seats limit reached (${tier.limits.openclowSeats})`)
  }

  if (currentUsage.storage > tier.limits.storage) {
    errors.push(`Storage limit exceeded (${tier.limits.storage}GB)`)
  }

  if (tier.limits.emailProcessing > 0 && currentUsage.emailsProcessed > tier.limits.emailProcessing) {
    errors.push(`Daily email limit exceeded (${tier.limits.emailProcessing})`)
  }

  if (tier.limits.documentPages > 0 && currentUsage.documentPages > tier.limits.documentPages) {
    errors.push(`Daily document limit exceeded (${tier.limits.documentPages})`)
  }

  return { allowed: errors.length === 0, errors }
}

// Feature flags for display
export const TIER_FEATURES = {
  solo: {
    creative: true,
    business: false,
    a2aBus: false,
  },
  collective: {
    creative: true,
    business: true,
    a2aBus: true,
  },
  label: {
    creative: true,
    business: true,
    a2aBus: true,
    whiteLabel: true,
  },
  network: {
    creative: true,
    business: true,
    a2aBus: true,
    whiteLabel: true,
    resell: true,
  },
}
