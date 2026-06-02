export type GuideSearchCategory =
  | 'guide'
  | 'docs'
  | 'developer'
  | 'dashboard'
  | 'blog'

export interface GuideSearchRecord {
  id: string
  title: string
  description: string
  href: string
  category: GuideSearchCategory
  keywords: string[]
}

export interface GuideSearchResult extends GuideSearchRecord {
  score: number
}

const GUIDE_SEARCH_INDEX: GuideSearchRecord[] = [
  {
    id: 'learn-home',
    title: 'Learn Agentbot',
    description: 'Main how-to hub for using Agentbot, onboarding, guides, and practical next steps.',
    href: '/learn',
    category: 'guide',
    keywords: ['guide', 'learn', 'how to use agentbot', 'getting started', 'help'],
  },
  {
    id: 'why-agentbot',
    title: 'Why Agentbot',
    description: 'Product explanation for what Agentbot is and why it exists instead of local-only OpenClaw.',
    href: '/why',
    category: 'guide',
    keywords: ['why', 'how agentbot works', 'platform', 'what is agentbot'],
  },
  {
    id: 'documentation',
    title: 'Docs and Operator Guide',
    description: 'Structured docs for plans, resources, runtime behavior, models, skills, and platform operations.',
    href: '/documentation',
    category: 'docs',
    keywords: ['docs', 'documentation', 'operator guide', 'platform docs', 'reference'],
  },
  {
    id: 'developers',
    title: 'For Developers',
    description: 'APIs, SDKs, architecture, runtime guides, Gitlawb, and implementation-facing documentation.',
    href: '/learn/developers',
    category: 'developer',
    keywords: ['developers', 'sdk', 'api', 'architecture', 'build on agentbot'],
  },
  {
    id: 'openclaw-dashboard',
    title: 'OpenClaw Dashboard Guide',
    description: 'Mission Control, missing dependencies, runtime setup, skill setup, replay retention, and broadcast workflow.',
    href: '/learn/developers/openclaw-dashboard',
    category: 'dashboard',
    keywords: ['openclaw', 'runtime', 'mission control', 'missing dependencies', 'ffmpeg', 'skills'],
  },
  {
    id: 'gitlawb-guide',
    title: 'Gitlawb Network Guide',
    description: 'How to use Gitlawb from Agentbot, browse the mirror, and connect agents to the network surface.',
    href: '/learn/developers/gitlawb-network',
    category: 'developer',
    keywords: ['gitlawb', 'did', 'repo', 'network', 'clone'],
  },
  {
    id: 'dj-stream',
    title: 'DJ Stream Dashboard',
    description: 'Go live on baseFM, use OBS or ffmpeg, refresh station pickup, and end sets cleanly.',
    href: '/dashboard/dj-stream',
    category: 'dashboard',
    keywords: ['basefm', 'dj', 'stream', 'mux', 'obs', 'ffmpeg', 'replay'],
  },
  {
    id: 'verify',
    title: 'Verify with SelfClaw',
    description: 'Verify with Self.xyz passport and hydrate your existing verified state inside Agentbot.',
    href: '/dashboard/verify',
    category: 'dashboard',
    keywords: ['verify', 'selfclaw', 'self.xyz', 'passport', 'human verification'],
  },
  {
    id: 'solana',
    title: 'Solana Dashboard',
    description: 'Wallet connect, Jupiter, OpenSea Solana NFT path, and token-holder utility flows.',
    category: 'dashboard',
    keywords: ['solana', 'wallet', 'jupiter', 'opensea', 'nft'],
  },
  {
    id: 'open-source-architecture',
    title: 'Open Source Multi-Tenant AI Agent Platform',
    description: 'Architecture post explaining Docker isolation, BYOK AI, payments, and how the platform works.',
    href: '/blog/posts/open-source-multi-tenant-architecture',
    category: 'blog',
    keywords: ['architecture', 'multi-tenant', 'how it works', 'docker', 'byok'],
  },
  {
    id: 'how-we-built',
    title: 'How We Built a Multi-Tenant AI Agent Platform',
    description: 'Deep-dive post covering platform architecture, gateway, BYOK, and the open-source strategy.',
    href: '/blog/posts/how-we-built-multi-tenant-agent-platform',
    category: 'blog',
    keywords: ['how we built', 'platform', 'multi-tenant', 'open source', 'gateway'],
  },
]

function normalize(text: string) {
  return text.toLowerCase().trim()
}

export function searchGuideIndex(query: string, limit = 12): GuideSearchResult[] {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return []

  const terms = normalizedQuery.split(/\s+/).filter(Boolean)

  const scored = GUIDE_SEARCH_INDEX.map((record) => {
    const title = normalize(record.title)
    const description = normalize(record.description)
    const keywords = record.keywords.map(normalize)

    let score = 0

    if (title === normalizedQuery) score += 200
    if (record.href === normalizedQuery) score += 180
    if (title.includes(normalizedQuery)) score += 100
    if (description.includes(normalizedQuery)) score += 50
    if (keywords.some((keyword) => keyword === normalizedQuery)) score += 120
    if (keywords.some((keyword) => keyword.includes(normalizedQuery))) score += 70

    for (const term of terms) {
      if (title.includes(term)) score += 24
      if (description.includes(term)) score += 10
      if (keywords.some((keyword) => keyword.includes(term))) score += 18
    }

    return {
      ...record,
      score,
    }
  })
    .filter((record) => record.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))

  return scored.slice(0, limit)
}
