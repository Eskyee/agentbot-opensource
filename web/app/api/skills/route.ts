import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

const SAMPLE_SKILLS = [
  {
    id: '1',
    name: 'Web Scraper',
    description: 'Extract data from any website',
    category: 'data',
    code: 'function scrape(url) { /* implementation */ }',
    author: 'Agentbot',
    downloads: 1250,
    rating: 4.8,
    featured: true
  },
  {
    id: '2',
    name: 'Email Sender',
    description: 'Send emails via SMTP',
    category: 'automation',
    code: 'function sendEmail(to, subject, body) { /* implementation */ }',
    author: 'Agentbot',
    downloads: 980,
    rating: 4.6,
    featured: true
  },
  {
    id: '3',
    name: 'CSV Parser',
    description: 'Parse and analyze CSV files',
    category: 'data',
    code: 'function parseCSV(file) { /* implementation */ }',
    author: 'Community',
    downloads: 750,
    rating: 4.5,
    featured: false
  },
  {
    id: '4',
    name: 'API Caller',
    description: 'Make HTTP requests to any API',
    category: 'web',
    code: 'function callAPI(url, method, data) { /* implementation */ }',
    author: 'Agentbot',
    downloads: 2100,
    rating: 4.9,
    featured: true
  },
  {
    id: '5',
    name: 'Database Query',
    description: 'Query PostgreSQL databases',
    category: 'data',
    code: 'function queryDB(sql) { /* implementation */ }',
    author: 'Community',
    downloads: 650,
    rating: 4.4,
    featured: false
  }
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  
  let skills = SAMPLE_SKILLS
  if (category && category !== 'all') {
    skills = skills.filter(s => s.category === category)
  }
  
  return NextResponse.json({ skills })
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
