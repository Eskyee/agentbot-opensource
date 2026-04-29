import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const TEMPLATES = [
  {
    name: 'THE-STRATEGIST',
    model: 'deepseek-r1',
    status: 'template',
    showcaseOptIn: true,
    showcaseDescription: 'Advanced reasoning for complex crew operations. Plans tours, logistics, and resource allocation.',
    config: {
      template: true,
      role: 'Mission Planning Agent',
      tier: 'label',
      brain: 'DeepSeek R1',
      skills: ['Mission Planning', 'Logistics', 'Resource Analysis', 'A2A Coordination'],
      description: 'Advanced reasoning for complex crew operations. Powered by DeepSeek R1. Plans tours, logistics, and resource allocation.',
    },
  },
  {
    name: 'CREW-MANAGER',
    model: 'llama-3.3',
    status: 'template',
    showcaseOptIn: true,
    showcaseDescription: 'The backbone of your collective. Manages autonomous royalty splits, talent bookings, and treasury reporting.',
    config: {
      template: true,
      role: 'Operations & Finance Agent',
      tier: 'collective',
      brain: 'Llama 3.3',
      skills: ['Royalty Splits', 'Talent Booking', 'Treasury Guard', 'USDC Payments'],
      description: 'The backbone of your collective. Manages autonomous royalty splits, talent bookings, and treasury reporting.',
    },
  },
  {
    name: 'SOUND-SYSTEM',
    model: 'mistral-7b',
    status: 'template',
    showcaseOptIn: true,
    showcaseDescription: 'Real-time automation for soundsystems. Monitors Mux streams, handles $RAVE gating, and fast community feedback.',
    config: {
      template: true,
      role: 'Automation & Feedback Agent',
      tier: 'solo',
      brain: 'Mistral 7B',
      skills: ['Mux Monitor', 'RAVE Gating', 'Fast Feedback', 'Live Traces'],
      description: 'Real-time automation for soundsystems. Monitors Mux streams, handles $RAVE gating, and fast community feedback.',
    },
  },
  {
    name: 'THE-DEVELOPER',
    model: 'qwen-2.5',
    status: 'template',
    showcaseOptIn: true,
    showcaseDescription: 'Expert agent for building custom logic. Generates smart contracts, shell scripts, and OpenClaw skill extensions.',
    config: {
      template: true,
      role: 'Logic & Scripting Agent',
      tier: 'collective',
      brain: 'Qwen 2.5',
      skills: ['Code Gen', 'Scripting', 'Contract Audit', 'Skill Builder'],
      description: 'Expert agent for building custom logic. Generates smart contracts, shell scripts, and OpenClaw skill extensions.',
    },
  },
]

async function main() {
  console.log('Seeding marketplace templates...')

  // Ensure system user exists for templates
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@agentbot.sh' },
    update: {},
    create: {
      email: 'system@agentbot.sh',
      name: 'Agentbot System',
      role: 'admin',
      plan: 'network',
    },
  })

  for (const template of TEMPLATES) {
    const existing = await prisma.agent.findFirst({
      where: { name: template.name, status: 'template' },
    })

    const data = { ...template, userId: systemUser.id }

    if (existing) {
      await prisma.agent.update({
        where: { id: existing.id },
        data,
      })
      console.log(`  Updated: ${template.name}`)
    } else {
      await prisma.agent.create({ data })
      console.log(`  Created: ${template.name}`)
    }
  }

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
