import { NextRequest, NextResponse } from 'next/server'

/**
 * Skills API - STUBBED
 * Returns hardcoded skills list
 * 
 * TODO: Implement database layer
 * - Store custom skills
 * - Track skill usage
 * - User skill preferences
 * - Skill analytics
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  // STUBBED: Hardcoded skills list (UI placeholder)
  const allSkills = [
    {
      id: 'dj-streaming',
      name: 'DJ Streaming',
      description: 'Stream live DJ sets via Mux',
      category: 'streaming',
      icon: '🎧',
      author: 'Agentbot',
      downloads: 150,
      rating: 5,
      featured: true,
      enabled: true
    },
    {
      id: 'guestlist',
      name: 'Guestlist Manager',
      description: 'Manage event guestlists',
      category: 'events',
      icon: '📋',
      author: 'Agentbot',
      downloads: 280,
      rating: 4.9,
      featured: true,
      enabled: true
    },
    {
      id: 'usdc-payments',
      name: 'USDC Payments',
      description: 'Accept USDC payments on Base',
      category: 'payments',
      icon: '💰',
      author: 'Agentbot',
      downloads: 420,
      rating: 4.8,
      featured: true,
      enabled: true
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Schedule events, manage availability',
      category: 'productivity',
      icon: '📆',
      author: 'Agentbot',
      downloads: 890,
      rating: 4.7,
      featured: true,
      enabled: true
    },
    {
      id: 'email',
      name: 'Email',
      description: 'Send and receive emails',
      category: 'communication',
      icon: '✉️',
      author: 'Agentbot',
      downloads: 760,
      rating: 4.5,
      featured: false,
      enabled: true
    },
    {
      id: 'telegram',
      name: 'Telegram',
      description: 'Connect via Telegram',
      category: 'channels',
      icon: '✈️',
      author: 'Agentbot',
      downloads: 2500,
      rating: 4.9,
      featured: true,
      enabled: true
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Connect via Discord',
      category: 'channels',
      icon: '🎮',
      author: 'Agentbot',
      downloads: 1800,
      rating: 4.8,
      featured: true,
      enabled: true
    },
    {
      id: 'browser',
      name: 'Browser Automation',
      description: 'Browse websites, scrape data',
      category: 'development',
      icon: '🌐',
      author: 'Agentbot',
      downloads: 2100,
      rating: 4.8,
      featured: true,
      enabled: true
    },
  ]

  // Filter by category if specified
  const skills = category
    ? allSkills.filter(s => s.category === category)
    : allSkills

  const categories = Array.from(new Set(allSkills.map(s => s.category)))
  const featured = allSkills.filter(s => s.featured)

  return NextResponse.json({
    skills,
    categories,
    featured,
    count: skills.length,
    message: 'Skills database integration pending - using hardcoded data'
  })
}

/**
 * Enable/disable skill for user
 */
export async function POST(req: NextRequest) {
  try {
    const { skillId, enabled } = await req.json()

    if (!skillId) {
      return NextResponse.json({ error: 'skillId required' }, { status: 400 })
    }

    // STUBBED: Just acknowledge the change
    return NextResponse.json({
      success: true,
      skillId,
      enabled,
      message: 'Skill preferences will be saved once database is ready'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
