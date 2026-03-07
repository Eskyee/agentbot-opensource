import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

const SKILLS = [
  {
    id: 'dj-streaming',
    name: 'DJ Streaming',
    description: 'Stream live DJ sets via Mux. Verify RAVE token holders for DJ access.',
    category: 'streaming',
    icon: '🎧',
    author: 'Agentbot',
    downloads: 150,
    rating: 5.0,
    featured: true
  },
  {
    id: 'guestlist',
    name: 'Guestlist Manager',
    description: 'Manage event guestlists, RSVPs, check-ins, and capacity limits.',
    category: 'events',
    icon: '📋',
    author: 'Agentbot',
    downloads: 280,
    rating: 4.9,
    featured: true
  },
  {
    id: 'usdc-payments',
    name: 'USDC Payments',
    description: 'Accept USDC payments on Base. Generate payment links, track transactions.',
    category: 'payments',
    icon: '💰',
    author: 'Agentbot',
    downloads: 420,
    rating: 4.8,
    featured: true
  },
  {
    id: 'treasury',
    name: 'Community Treasury',
    description: 'Track spending, reimbursements, and multi-sig treasury management.',
    category: 'finance',
    icon: '🏦',
    author: 'Agentbot',
    downloads: 320,
    rating: 4.7,
    featured: true
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Schedule events, manage availability, set reminders. Full Google Calendar sync.',
    category: 'productivity',
    icon: '📆',
    author: 'Agentbot',
    downloads: 890,
    rating: 4.7,
    featured: true
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Send and receive emails. Newsletter support included.',
    category: 'communication',
    icon: '✉️',
    author: 'Agentbot',
    downloads: 760,
    rating: 4.5,
    featured: false
  },
  {
    id: 'webhook',
    name: 'Webhooks',
    description: 'Connect to any API. HTTP requests, webhooks, integrations.',
    category: 'development',
    icon: '🔗',
    author: 'Agentbot',
    downloads: 1100,
    rating: 4.9,
    featured: false
  },
  {
    id: 'browser',
    name: 'Browser Automation',
    description: 'Browse websites, fill forms, scrape data autonomously.',
    category: 'development',
    icon: '🌐',
    author: 'Agentbot',
    downloads: 2100,
    rating: 4.8,
    featured: true
  },
  {
    id: 'file-manager',
    name: 'File Manager',
    description: 'Upload, download, organize files. Local storage integration.',
    category: 'productivity',
    icon: '📁',
    author: 'Agentbot',
    downloads: 650,
    rating: 4.4,
    featured: false
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Connect via Telegram. Bot commands, messages, groups.',
    category: 'channels',
    icon: '✈️',
    author: 'Agentbot',
    downloads: 2500,
    rating: 4.9,
    featured: true
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Connect via Discord. Slash commands, embeds, voice channels.',
    category: 'channels',
    icon: '🎮',
    author: 'Agentbot',
    downloads: 1800,
    rating: 4.8,
    featured: true
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Connect via WhatsApp. Message templates, media, status updates.',
    category: 'channels',
    icon: '💬',
    author: 'Agentbot',
    downloads: 1200,
    rating: 4.7,
    featured: true
  },
  {
    id: 'whatsapp-business',
    name: 'WhatsApp Business',
    description: 'Full WhatsApp Business API. Automated replies, labels, catalogs.',
    category: 'channels',
    icon: '📱',
    author: 'Agentbot',
    downloads: 450,
    rating: 4.6,
    featured: false
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Gmail, Calendar, Drive, Sheets integration.',
    category: 'productivity',
    icon: '🔵',
    author: 'Community',
    downloads: 920,
    rating: 4.5,
    featured: false
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync with Notion databases, pages, and workflows.',
    category: 'productivity',
    icon: '🗂️',
    author: 'Community',
    downloads: 780,
    rating: 4.6,
    featured: false
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Post to channels, create threads, handle slash commands.',
    category: 'channels',
    icon: '💼',
    author: 'Agentbot',
    downloads: 1100,
    rating: 4.7,
    featured: false
  }
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const featured = searchParams.get('featured')
  
  let skills = [...SKILLS]
  
  if (category && category !== 'all') {
    skills = skills.filter(s => s.category === category)
  }
  
  if (featured === 'true') {
    skills = skills.filter(s => s.featured)
  }
  
  const categories = [...new Set(SKILLS.map(s => s.category))]
  
  return NextResponse.json({ 
    skills,
    categories,
    featured: SKILLS.filter(s => s.featured)
  })
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { skillId, agentId } = await request.json()
  
  // TODO: Save to InstalledSkill table
  return NextResponse.json({ success: true })
}
