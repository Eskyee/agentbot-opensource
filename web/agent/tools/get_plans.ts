import { defineTool } from 'eve/tools'
import { z } from 'zod'

const PLANS = {
  free: { price: 'Free', memory: '—', cpus: 0, blurb: 'Bring your own API key (BYOK).' },
  solo: { price: '£29/mo', memory: '2g', cpus: 1, blurb: 'One agent, solo creators.' },
  collective: { price: '£69/mo', memory: '4g', cpus: 2, blurb: 'Small crews and collectives.' },
  label: { price: '£149/mo', memory: '8g', cpus: 4, blurb: 'Labels running multiple agents.' },
  network: { price: '£499/mo', memory: '16g', cpus: 4, blurb: 'Networks at scale.' },
} as const

export default defineTool({
  description:
    'Look up Agentbot subscription plans, pricing, and container resources. Returns one plan when `plan` is given, otherwise all plans.',
  inputSchema: z.object({
    plan: z
      .enum(['free', 'solo', 'collective', 'label', 'network'])
      .optional()
      .describe('Optional specific plan to look up; omit to list every plan.'),
  }),
  async execute({ plan }) {
    if (plan) {
      return { plan, ...PLANS[plan] }
    }
    return { plans: PLANS }
  },
})
