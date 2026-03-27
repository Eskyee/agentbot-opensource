import { NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

// Default skills catalog — used as seed data if Skill table is empty
const DEFAULT_SKILLS = [
  { name: 'DJ Streaming', description: 'Stream live DJ sets via Mux. Verify RAVE token holders for DJ access.', category: 'streaming', author: 'Agentbot', downloads: 150, rating: 5.0, featured: true },
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
]

/**
 * Ensure skills are seeded in the database.
 * Runs once on first request; subsequent calls are a no-op.

export const dynamic = 'force-dynamic';
 */
async function ensureSkillsSeeded() {
  const count = await prisma.skill.count()
  if (count > 0) return

  await prisma.skill.createMany({
    data: DEFAULT_SKILLS.map(s => ({ ...s, code: '' })),
    skipDuplicates: true,
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const featured = searchParams.get('featured')

  try {
    await ensureSkillsSeeded()

    const where: Record<string, any> = {}
    if (category && category !== 'all') where.category = category
    if (featured === 'true') where.featured = true

    const skills = await prisma.skill.findMany({
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
      },
    })

    const categories = await prisma.skill.findMany({
      distinct: ['category'],
      select: { category: true },
    })

    return NextResponse.json({
      skills,
      categories: categories.map(c => c.category),
      featured: skills.filter(s => s.featured),
    })
  } catch (error) {
    console.error('Skills fetch error:', error)
    // Graceful fallback to defaults if DB unavailable
    let skills = DEFAULT_SKILLS.map((s, i) => ({ id: `default-${i}`, ...s }))
    if (category && category !== 'all') skills = skills.filter(s => s.category === category)
    if (featured === 'true') skills = skills.filter(s => s.featured)
    const categories = [...new Set(DEFAULT_SKILLS.map(s => s.category))]
    return NextResponse.json({ skills, categories, featured: skills.filter(s => s.featured) })
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

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Verify skill exists
    const skill = await prisma.skill.findUnique({ where: { id: skillId } })
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    // Install skill (upsert to handle duplicates)
    const installed = await prisma.installedSkill.upsert({
      where: {
        userId_agentId_skillId: {
          userId: session.user.id,
          agentId,
          skillId,
        },
      },
      update: { enabled: true },
      create: {
        userId: session.user.id,
        agentId,
        skillId,
      },
    })

    // Increment download count
    await prisma.skill.update({
      where: { id: skillId },
      data: { downloads: { increment: 1 } },
    })

    return NextResponse.json({ success: true, installed })
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

    await prisma.installedSkill.deleteMany({
      where: {
        userId: session.user.id,
        agentId,
        skillId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Skill uninstall error:', error)
    return NextResponse.json({ error: 'Failed to uninstall skill' }, { status: 500 })
  }
}
