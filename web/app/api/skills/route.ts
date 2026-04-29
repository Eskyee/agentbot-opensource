import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { isAdminEmail } from '@/app/lib/admin'
import { prisma } from '@/app/lib/prisma'
import { deploySkillToAgent, removeSkillFromAgent } from '@/app/lib/agent-deploy'
import { BASEFM_DJ_SKILL_CODE, BASEFM_DJ_SKILL_NAME, ensureBasefmDjSkill } from '@/app/lib/basefmDjSkill'
import { scanSkillMarketplaceInput } from '@/app/lib/skillMarketplaceSafety'

// Default skills catalog — used as seed data if Skill table is empty
const DEFAULT_SKILLS = [
  { name: BASEFM_DJ_SKILL_NAME, description: 'Create baseFM streams, fetch live DJs, and generate ffmpeg broadcaster commands for agent DJs.', category: 'streaming', author: 'Agentbot', downloads: 150, rating: 5.0, featured: true },
  { name: 'Guestlist Manager', description: 'Manage event guestlists, RSVPs, check-ins, and capacity limits.', category: 'events', author: 'Agentbot', downloads: 280, rating: 4.9, featured: true },
  { name: 'USDC Payments', description: 'Accept USDC payments on Base. Generate payment links, track transactions.', category: 'payments', author: 'Agentbot', downloads: 420, rating: 4.8, featured: true },
  { name: 'Community Treasury', description: 'Track spending, reimbursements, and multi-sig treasury management.', category: 'finance', author: 'Agentbot', downloads: 320, rating: 4.7, featured: true },
  { name: 'Google Calendar', description: 'Schedule events, manage availability, set reminders. Full Google Calendar sync.', category: 'productivity', author: 'Agentbot', downloads: 890, rating: 4.7, featured: true },
  { name: 'Email', description: 'Send and receive emails. Newsletter support included.', category: 'communication', author: 'Agentbot', downloads: 760, rating: 4.5, featured: false },
  { name: 'Webhooks', description: 'Connect to any API. HTTP requests, webhooks, integrations.', category: 'development', author: 'Agentbot', downloads: 1100, rating: 4.9, featured: false },
  { name: 'Browser Automation', description: 'Browse websites, fill forms, scrape data autonomously.', category: 'development', author: 'Agentbot', downloads: 2100, rating: 4.8, featured: true },
  { name: 'File Manager', description: 'Upload, download, organize files. Local storage integration.', category: 'productivity', author: 'Agentbot', downloads: 650, rating: 4.4, featured: false },
  { name: 'Telegram', description: 'Connect via Telegram. Bot commands, messages, groups.', category: 'channels', author: 'Agentbot', downloads: 2500, rating: 4.9, featured: true },
  { name: 'Discord', description: 'Connect via Discord. Slash commands, embeds, voice channels.', category: 'channels', author: 'Agentbot', downloads: 1800, rating: 4.8, featured: true },
  { name: 'WhatsApp', description: 'Connect via WhatsApp. Message templates, media, status updates.', category: 'channels', author: 'Agentbot', downloads: 1200, rating: 4.7, featured: true },
  { name: 'WhatsApp Business', description: 'Full WhatsApp Business API. Automated replies, labels, catalogs.', category: 'channels', author: 'Agentbot', downloads: 450, rating: 4.6, featured: false },
  { name: 'Google Workspace', description: 'Gmail, Calendar, Drive, Sheets integration.', category: 'productivity', author: 'Community', downloads: 920, rating: 4.5, featured: false },
  { name: 'Notion', description: 'Sync with Notion databases, pages, and workflows.', category: 'productivity', author: 'Community', downloads: 780, rating: 4.6, featured: false },
  { name: 'Slack', description: 'Post to channels, create threads, handle slash commands.', category: 'channels', author: 'Agentbot', downloads: 1100, rating: 4.7, featured: false },
  { name: 'Royalty Tracker', description: 'Track streaming royalties across platforms in USDC.', category: 'finance', author: 'Agentbot', downloads: 0, rating: 5.0, featured: true },
  { name: 'Demo Submitter', description: 'Submit demos to Base FM for airplay consideration.', category: 'music', author: 'Agentbot', downloads: 0, rating: 5.0, featured: true },
  { name: 'Visual Synthesizer', description: 'Generate release artwork and social media assets using Stable Diffusion XL.', category: 'creative', author: 'Agentbot', downloads: 0, rating: 5.0, featured: true },
  { name: 'Track Archaeologist', description: 'Deep catalog digging via BlockDB similarity search. Find tracks, clear samples.', category: 'music', author: 'Agentbot', downloads: 0, rating: 5.0, featured: true },
  { name: 'Setlist Oracle', description: 'Analyze BPM, key, and energy curves to build perfect DJ sets with Camelot mixing.', category: 'music', author: 'Agentbot', downloads: 0, rating: 5.0, featured: true },
  { name: 'Groupie Manager', description: 'Fan segmentation, lifecycle tracking, and automated merch drop campaigns.', category: 'marketing', author: 'Agentbot', downloads: 0, rating: 5.0, featured: true },
  { name: 'Event Ticketing', description: 'Sell tickets with USDC payments on Base via x402 protocol.', category: 'events', author: 'Agentbot', downloads: 0, rating: 5.0, featured: true },
  { name: 'Event Scheduler', description: 'Schedule events across Telegram, Discord, WhatsApp, Email with recurring support.', category: 'events', author: 'Agentbot', downloads: 0, rating: 5.0, featured: true },
  { name: 'Venue Finder', description: 'Find venues worldwide. UK, Europe, US, Asia with capacity and price filters.', category: 'events', author: 'Agentbot', downloads: 0, rating: 5.0, featured: true },
  { name: 'Festival Finder', description: 'Discover festivals globally, compare lineups, get UK and Europe recommendations.', category: 'events', author: 'Agentbot', downloads: 0, rating: 5.0, featured: true },
  { name: 'Spotify Analytics', description: 'Track streams, followers, playlist placements. Cross-platform analytics dashboard.', category: 'music', author: 'Agentbot', downloads: 0, rating: 5.0, featured: true },
  { name: 'SoundCloud Manager', description: 'Upload tracks, manage likes, track reposts, analyze audience demographics.', category: 'music', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  { name: 'Bandcamp Sync', description: 'Sync releases, track sales, manage merchandise across Bandcamp.', category: 'music', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  { name: 'Crypto Price Alerts', description: 'Monitor crypto prices, send alerts via Telegram/Discord when thresholds hit.', category: 'finance', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  { name: 'DeFi Portfolio', description: 'Track wallet holdings, LP positions, yield farming across Base/Ethereum.', category: 'finance', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  { name: 'Invoice Generator', description: 'Create and send invoices in USDC. Track payments, send reminders.', category: 'finance', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  { name: 'AI Image Generator', description: 'Generate images via Stable Diffusion, DALL-E, or Midjourney. Batch processing.', category: 'creative', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  { name: 'Video Editor', description: 'Auto-edit video clips, add transitions, captions, and background music.', category: 'creative', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  { name: 'Podcast Producer', description: 'Auto-edit podcasts, remove filler words, add intro/outro music.', category: 'creative', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  { name: 'CRM Helper', description: 'Track leads, follow-ups, and customer interactions across channels.', category: 'productivity', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  { name: 'Meeting Notes', description: 'Auto-generate meeting notes from Zoom/Google Meet transcripts.', category: 'productivity', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  { name: 'Content Calendar', description: 'Plan and schedule social media posts across all platforms.', category: 'marketing', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  { name: 'SEO Analyzer', description: 'Analyze website SEO, suggest keywords, audit backlinks.', category: 'marketing', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  { name: 'Affiliate Tracker', description: 'Track affiliate links, clicks, conversions across networks.', category: 'marketing', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  // v2026.4.5 new features
  { name: 'Video Generator', description: 'Generate videos via xAI Grokin, Runway, or Wan. AI-powered video creation for social media and marketing.', category: 'creative', author: 'OpenClaw v2026.4.5', downloads: 0, rating: 5.0, featured: true },
  { name: 'Music Generator', description: 'Create original music with Google Lyria or MiniMax. Async generation with follow-up delivery.', category: 'creative', author: 'OpenClaw v2026.4.5', downloads: 0, rating: 5.0, featured: true },
  { name: 'ComfyUI Workflows', description: 'Run ComfyUI workflows locally or on Comfy Cloud. Image, video, and music generation with custom prompts.', category: 'creative', author: 'OpenClaw v2026.4.5', downloads: 0, rating: 5.0, featured: false },
  { name: 'Qwen AI', description: 'Use Qwen models for chat, reasoning, and tool calling. Bundled provider with fast inference.', category: 'ai', author: 'OpenClaw v2026.4.5', downloads: 0, rating: 5.0, featured: false },
  { name: 'Fireworks AI', description: 'Access Fireworks AI models for generation and reasoning. High-throughput inference.', category: 'ai', author: 'OpenClaw v2026.4.5', downloads: 0, rating: 5.0, featured: false },
  { name: 'Bedrock Mantle', description: 'Use Amazon Bedrock Mantle models with automatic inference profile discovery.', category: 'ai', author: 'OpenClaw v2026.4.5', downloads: 0, rating: 5.0, featured: false },
  // v2026.4.9 — adapted from Kilo-Org/cloud
  { name: 'Chat SDK', description: 'Build multi-platform chat bots. One SDK for Slack, Teams, Discord, Google Chat, GitHub, and Linear.', category: 'channels', author: 'Kilo-Org', downloads: 0, rating: 5.0, featured: true },
  { name: 'Sentry CLI', description: 'Monitor production errors, stream logs, triage issues, and run AI root cause analysis from the CLI.', category: 'development', author: 'Kilo-Org', downloads: 0, rating: 5.0, featured: true },
  { name: 'Docker Containers', description: 'Best practices for building and managing agent containers. Resource limits, health checks, security.', category: 'development', author: 'Agentbot', downloads: 0, rating: 5.0, featured: true },
  { name: 'Stateful Agents', description: 'Persistent state, agent-to-agent coordination, scheduled tasks, and Drizzle ORM SQLite migrations.', category: 'development', author: 'Agentbot', downloads: 0, rating: 5.0, featured: true },
  { name: 'Deploy CLI', description: 'CLI reference for deploying agents, managing secrets, streaming logs, and troubleshooting containers.', category: 'development', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
  { name: 'Code Review', description: 'Review agent code against production best practices. Security, state management, and anti-pattern detection.', category: 'development', author: 'Agentbot', downloads: 0, rating: 5.0, featured: false },
]


/**
 * Ensure skills are seeded in the database.
 * Uses upsert-like logic to ensure new default skills are added even to existing databases.
 */
async function ensureSkillsSeeded() {
  for (const skill of DEFAULT_SKILLS) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {
        description: skill.description,
        category: skill.category,
        author: skill.author,
        featured: skill.featured,
        // Don't overwrite dynamic stats
      },
      create: {
        ...skill,
        code: skill.name === BASEFM_DJ_SKILL_NAME ? BASEFM_DJ_SKILL_CODE : '',
      },
    })
  }

  await ensureBasefmDjSkill()
}

async function getSkillTargetContext(agentId: string, session: NonNullable<Awaited<ReturnType<typeof getAuthSession>>>) {
  const directAgent = await prisma.agent.findFirst({
    where: { id: agentId, userId: session.user.id },
  })

  if (directAgent) {
    return { agent: directAgent, targetUserId: session.user.id, runtimeHydrated: false }
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      openclawInstanceId: agentId,
      ...(isAdminEmail(session.user.email) ? {} : { id: session.user.id }),
    },
    select: {
      id: true,
      openclawInstanceId: true,
      openclawUrl: true,
    },
  })

  if (!targetUser?.openclawInstanceId) {
    return null
  }

  const synthesizedAgent = await prisma.agent.upsert({
    where: { id: targetUser.openclawInstanceId },
    update: {
      userId: targetUser.id,
      websocketUrl: targetUser.openclawUrl,
      status: 'running',
    },
    create: {
      id: targetUser.openclawInstanceId,
      userId: targetUser.id,
      name: 'Managed OpenClaw Runtime',
      model: 'openclaw',
      status: 'running',
      websocketUrl: targetUser.openclawUrl,
    },
  })

  return { agent: synthesizedAgent, targetUserId: targetUser.id, runtimeHydrated: true }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const featured = searchParams.get('featured')
  const agentId = searchParams.get('agentId')
  const search = searchParams.get('search')

  // Resolve session once — used to include installed skill IDs in response
  const session = await getAuthSession()

  try {
    await ensureSkillsSeeded()

    const where: Record<string, any> = {}
    if (category && category !== 'all') where.category = category
    if (featured === 'true') where.featured = true
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [skills, categories] = await Promise.all([
      prisma.skill.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { downloads: 'desc' }],
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          author: true,
          downloads: true,
          rating: true,
          featured: true,
          code: true,
        },
      }),
      prisma.skill.findMany({
        distinct: ['category'],
        select: { category: true },
      }),
    ])

    // Return which skills are already installed for this user+agent combo
    let installedSkillIds: string[] = []
    if (session?.user?.id) {
      const installed = await prisma.installedSkill.findMany({
        where: {
          userId: session.user.id,
          ...(agentId ? { agentId } : {}),
          enabled: true,
        },
        select: { skillId: true },
      })
      installedSkillIds = installed.map(i => i.skillId)
    }

    return NextResponse.json({
      skills: skills.map((skill) => ({
        ...skill,
        scan: scanSkillMarketplaceInput({
          name: skill.name,
          description: skill.description,
          code: skill.code,
          author: skill.author,
          featured: skill.featured,
        }),
      })),
      categories: categories.map(c => c.category),
      featured: skills.filter(s => s.featured).map((skill) => ({
        ...skill,
        scan: scanSkillMarketplaceInput({
          name: skill.name,
          description: skill.description,
          code: skill.code,
          author: skill.author,
          featured: skill.featured,
        }),
      })),
      installedSkillIds,
    })
  } catch (error) {
    console.error('Skills fetch error:', error)
    // Graceful fallback to defaults if DB unavailable
    let skills = DEFAULT_SKILLS.map((s, i) => ({ id: `default-${i}`, ...s, code: s.name === BASEFM_DJ_SKILL_NAME ? BASEFM_DJ_SKILL_CODE : '' }))
    if (category && category !== 'all') skills = skills.filter(s => s.category === category)
    if (featured === 'true') skills = skills.filter(s => s.featured)
    const categories = [...new Set(DEFAULT_SKILLS.map(s => s.category))]
    const withScan = skills.map((skill) => ({
      ...skill,
      scan: scanSkillMarketplaceInput({
        name: skill.name,
        description: skill.description,
        code: skill.code,
        author: skill.author,
        featured: skill.featured,
      }),
    }))
    return NextResponse.json({ skills: withScan, categories, featured: withScan.filter(s => s.featured), installedSkillIds: [] })
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { skillId, agentId } = await request.json()

    if (!skillId || !agentId) {
      return NextResponse.json({ error: 'skillId and agentId are required' }, { status: 400 })
    }

    const target = await getSkillTargetContext(agentId, session)
    const agent = target?.agent

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Verify skill exists
    const skill = await prisma.skill.findUnique({ where: { id: skillId } })
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    const scan = scanSkillMarketplaceInput({
      name: skill.name,
      description: skill.description,
      code: skill.code,
      author: skill.author,
      featured: skill.featured,
    })

    if (!scan.installAllowed) {
      return NextResponse.json(
        { error: 'Skill blocked by marketplace safety checks', scan },
        { status: 400 }
      )
    }

    // Install skill (upsert to handle duplicates)
    const installed = await prisma.installedSkill.upsert({
      where: {
        userId_agentId_skillId: {
          userId: target!.targetUserId,
          agentId: agent.id,
          skillId,
        },
      },
      update: { enabled: true },
      create: {
        userId: target!.targetUserId,
        agentId: agent.id,
        skillId,
      },
    })

    // Increment download count
    await prisma.skill.update({
      where: { id: skillId },
      data: { downloads: { increment: 1 } },
    })

    // Deploy skill to OpenClaw gateway (don't fail if gateway is down)
    try {
      const deployResult = await deploySkillToAgent(agent.id, skillId)
      if (!deployResult.success) {
        console.warn(`[Skill Install] Gateway deploy warning: ${deployResult.error}`)
        return NextResponse.json({ 
          success: true, 
          installed,
          runtimeHydrated: target!.runtimeHydrated,
          deployed: false,
          deployWarning: deployResult.error,
          message: target!.runtimeHydrated
            ? 'Skill saved and the managed runtime agent record was created. Gateway deploy still needs attention.'
            : 'Skill saved, but gateway deploy still needs attention.',
        })
      }
      return NextResponse.json({
        success: true,
        installed,
        runtimeHydrated: target!.runtimeHydrated,
        deployed: true,
        message: target!.runtimeHydrated
          ? 'Skill installed and the managed runtime agent record was created successfully.'
          : 'Skill installed successfully.',
      })
    } catch (gatewayError) {
      console.warn('[Skill Install] Gateway deploy failed (will retry on sync):', gatewayError)
      return NextResponse.json({ 
        success: true, 
        installed,
        runtimeHydrated: target!.runtimeHydrated,
        deployed: false,
        deployWarning: 'Gateway unreachable - skill saved to database and will sync automatically',
        message: target!.runtimeHydrated
          ? 'Skill saved, the managed runtime agent record was created, and the runtime will pick it up when gateway sync recovers.'
          : 'Skill saved to the database and will sync to the runtime automatically.',
      })
    }
  } catch (error) {
    console.error('Skill install error:', error)
    return NextResponse.json({ error: 'Failed to install skill' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { skillId, agentId } = await request.json()

    if (!skillId || !agentId) {
      return NextResponse.json({ error: 'skillId and agentId are required' }, { status: 400 })
    }

    const target = await getSkillTargetContext(agentId, session)
    const agent = target?.agent

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    await prisma.installedSkill.deleteMany({
      where: {
        userId: target!.targetUserId,
        agentId: agent.id,
        skillId,
      },
    })

    // Remove skill from OpenClaw gateway (don't fail if gateway is down)
    try {
      await removeSkillFromAgent(agent.id, skillId)
    } catch (gatewayError) {
      console.warn('[Skill Uninstall] Gateway removal failed:', gatewayError)
    }

    return NextResponse.json({
      success: true,
      runtimeHydrated: target!.runtimeHydrated,
      message: target!.runtimeHydrated
        ? 'Skill removed and the managed runtime agent record remains available for future installs.'
        : 'Skill removed successfully.',
    })
  } catch (error) {
    console.error('Skill uninstall error:', error)
    return NextResponse.json({ error: 'Failed to uninstall skill' }, { status: 500 })
  }
}
