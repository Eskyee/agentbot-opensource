import { prisma } from '@/app/lib/prisma'
import { fetchRecentXSignals } from '@/app/lib/xApi'
import { listGitlawbAgentsForUser } from '@/app/lib/gitlawb'

export type PaidToolId = 'trend-intel' | 'x-ops' | 'job-intel' | 'repo-intel'

export interface PaidToolDefinition {
  id: PaidToolId
  name: string
  description: string
  category: 'Research' | 'Social' | 'Jobs' | 'Developer'
  priceRange: string
  networks: string[]
  workflowChain: string[]
}

export const paidTools: PaidToolDefinition[] = [
  {
    id: 'trend-intel',
    name: 'Trend Intel',
    description: 'Cross-platform trend clustering across X, Reddit, Hacker News, and optional technical sources like GitHub and GitLawb.',
    category: 'Research',
    priceRange: '$0.15-$0.35',
    networks: ['eip155:8453', 'eip155:84532'],
    workflowChain: ['trend-intel -> x-ops', 'trend-intel -> repo-intel'],
  },
  {
    id: 'x-ops',
    name: 'X Ops',
    description: 'Turn X/Twitter topics, mentions, and account signals into operator summaries and next-draft recommendations.',
    category: 'Social',
    priceRange: '$0.05-$0.20',
    networks: ['eip155:8453', 'eip155:84532'],
    workflowChain: ['x-ops -> draft approval -> publish'],
  },
  {
    id: 'job-intel',
    name: 'Job Intel',
    description: 'Cluster hiring demand, repeated skills, and company patterns from Agentbot job listings.',
    category: 'Jobs',
    priceRange: '$0.05-$0.25',
    networks: ['eip155:8453', 'eip155:84532'],
    workflowChain: ['job-intel -> repo-intel', 'job-intel -> creator-intel'],
  },
  {
    id: 'repo-intel',
    name: 'Repo Intel',
    description: 'Analyze GitHub repositories and optionally enrich with user GitLawb-connected agent repos for technical topics.',
    category: 'Developer',
    priceRange: '$0.08-$0.30',
    networks: ['eip155:8453', 'eip155:84532'],
    workflowChain: ['repo-intel -> trend-intel', 'repo-intel -> x-ops'],
  },
]

export function getPaidTool(toolId: string) {
  return paidTools.find((tool) => tool.id === toolId)
}

export function quotePaidTool(toolId: PaidToolId, input: Record<string, unknown>) {
  switch (toolId) {
    case 'trend-intel': {
      const depth = String(input.depth || 'quick')
      const technical = Boolean(input.technical) || (Array.isArray(input.sources) && input.sources.includes('github'))
      if (depth === 'standard' && technical) return { amount: '0.35', displayAmount: '$0.35', currency: 'USDC', scheme: 'exact', network: 'eip155:8453' }
      if (depth === 'standard') return { amount: '0.25', displayAmount: '$0.25', currency: 'USDC', scheme: 'exact', network: 'eip155:8453' }
      if (technical) return { amount: '0.22', displayAmount: '$0.22', currency: 'USDC', scheme: 'exact', network: 'eip155:8453' }
      return { amount: '0.15', displayAmount: '$0.15', currency: 'USDC', scheme: 'exact', network: 'eip155:8453' }
    }
    case 'x-ops':
      return { amount: '0.08', displayAmount: '$0.08', currency: 'USDC', scheme: 'exact', network: 'eip155:8453' }
    case 'job-intel':
      return { amount: '0.10', displayAmount: '$0.10', currency: 'USDC', scheme: 'exact', network: 'eip155:8453' }
    case 'repo-intel':
      return { amount: '0.12', displayAmount: '$0.12', currency: 'USDC', scheme: 'exact', network: 'eip155:8453' }
  }
}

async function fetchHackerNewsSignals(topic: string) {
  const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
    signal: AbortSignal.timeout(8000),
  })
  const topIds: number[] = await res.json()
  const stories = await Promise.all(
    topIds.slice(0, 30).map(async (id) => {
      try {
        const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          signal: AbortSignal.timeout(5000),
        })
        return itemRes.json()
      } catch {
        return null
      }
    })
  )

  const lower = topic.toLowerCase()
  return stories
    .filter((story: any) => story?.title && `${story.title} ${story.text || ''}`.toLowerCase().includes(lower))
    .slice(0, 5)
    .map((story: any) => ({
      id: `hn-${story.id}`,
      source: 'hacker-news',
      title: story.title,
      url: `https://news.ycombinator.com/item?id=${story.id}`,
      score: story.score || 0,
      comments: story.descendants || 0,
    }))
}

async function fetchRedditSignals(topic: string) {
  const query = encodeURIComponent(topic)
  const res = await fetch(`https://www.reddit.com/search.json?q=${query}&limit=10&sort=relevance&t=month`, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Agentbot-PaidTools/1.0' },
  })
  const json = await res.json()
  const posts = Array.isArray(json?.data?.children) ? json.data.children : []
  return posts.slice(0, 5).map((entry: any) => ({
    id: `reddit-${entry.data.id}`,
    source: 'reddit',
    title: entry.data.title,
    url: `https://reddit.com${entry.data.permalink}`,
    score: entry.data.ups || 0,
    comments: entry.data.num_comments || 0,
  }))
}

async function searchGitHubRepositories(topic: string) {
  const query = encodeURIComponent(`${topic} in:name,description,readme sort:stars`)
  const res = await fetch(`https://api.github.com/search/repositories?q=${query}&per_page=5`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Agentbot-PaidTools',
    },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) return []
  const json = await res.json()
  const items = Array.isArray(json?.items) ? json.items : []
  return items.map((repo: any) => ({
    source: 'github',
    fullName: repo.full_name,
    description: repo.description,
    stars: repo.stargazers_count,
    language: repo.language,
    url: repo.html_url,
  }))
}

async function fetchGitHubRepoDetails(input: Record<string, unknown>) {
  const url = String(input.url || '').trim()
  const owner = String(input.owner || '').trim()
  const repo = String(input.repo || '').trim()
  let repoOwner = owner
  let repoName = repo

  if (url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/)
    if (match) {
      repoOwner = match[1]
      repoName = match[2]
    }
  }

  if (!repoOwner || !repoName) {
    throw new Error('owner/repo or github url required')
  }

  const [repoRes, commitsRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Agentbot-PaidTools',
      },
      signal: AbortSignal.timeout(8000),
    }),
    fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=10`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Agentbot-PaidTools',
      },
      signal: AbortSignal.timeout(8000),
    }),
  ])

  if (!repoRes.ok) {
    throw new Error(`GitHub repo lookup failed: ${repoRes.status}`)
  }

  const repoJson = await repoRes.json()
  const commitsJson = commitsRes.ok ? await commitsRes.json() : []

  return {
    repository: {
      owner: repoOwner,
      repo: repoName,
      fullName: repoJson.full_name,
      description: repoJson.description,
      stars: repoJson.stargazers_count,
      forks: repoJson.forks_count,
      language: repoJson.language,
      updatedAt: repoJson.updated_at,
      url: repoJson.html_url,
    },
    commits: Array.isArray(commitsJson)
      ? commitsJson.slice(0, 10).map((commit: any) => ({
          sha: String(commit.sha || '').slice(0, 7),
          message: String(commit.commit?.message || '').split('\n')[0],
          author: commit.commit?.author?.name || 'unknown',
          date: commit.commit?.author?.date || null,
          url: commit.html_url,
        }))
      : [],
  }
}

async function fetchGitlawbContext(userId: string | null) {
  if (!userId) return []
  const agents = await listGitlawbAgentsForUser(userId).catch(() => [])
  return agents
    .filter((agent) => agent.gitlawb?.status === 'identity_ready')
    .slice(0, 5)
    .map((agent) => ({
      source: 'gitlawb',
      agentId: agent.id,
      name: agent.name,
      repo: agent.gitlawb?.repo,
      webUrl: agent.gitlawb?.webUrl,
      cloneUrl: agent.gitlawb?.cloneUrl,
    }))
}

async function executeTrendIntel(input: Record<string, unknown>, userId?: string | null) {
  const topic = String(input.topic || '').trim()
  const depth = String(input.depth || 'quick')
  if (!topic) throw new Error('topic is required')

  const requestedSources = Array.isArray(input.sources)
    ? input.sources.map((source) => String(source).toLowerCase())
    : []
  const technical =
    Boolean(input.technical) ||
    /api|sdk|repo|git|github|gitlawb|open source|typescript|python|mcp|framework/i.test(topic)

  const includeGitHub = technical || requestedSources.includes('github')
  const includeGitlawb = technical || requestedSources.includes('gitlawb')

  const xSignals = await fetchRecentXSignals(`${topic} lang:en -is:retweet`).catch(() => [])
  const [hnSignals, redditSignals, githubRepos, gitlawbRepos] = await Promise.all([
    fetchHackerNewsSignals(topic).catch(() => []),
    fetchRedditSignals(topic).catch(() => []),
    includeGitHub ? searchGitHubRepositories(topic).catch(() => []) : Promise.resolve([]),
    includeGitlawb ? fetchGitlawbContext(userId || null).catch(() => []) : Promise.resolve([]),
  ])

  const clusters = [
    { source: 'x', count: xSignals.length },
    { source: 'hacker-news', count: hnSignals.length },
    { source: 'reddit', count: redditSignals.length },
    { source: 'github', count: githubRepos.length },
    { source: 'gitlawb', count: gitlawbRepos.length },
  ].filter((cluster) => cluster.count > 0)

  return {
    summary: `${topic} shows strongest signal on ${clusters.map((cluster) => `${cluster.source} (${cluster.count})`).join(', ') || 'no tracked source'}.`,
    depth,
    topic,
    technical,
    clusters,
    evidence: {
      x: xSignals.slice(0, 5),
      hackerNews: hnSignals,
      reddit: redditSignals,
      github: githubRepos,
      gitlawb: gitlawbRepos,
    },
    nextTools: ['x-ops', 'repo-intel'],
  }
}

async function executeXOps(input: Record<string, unknown>) {
  const query = String(input.query || input.handle || '').trim()
  if (!query) throw new Error('query or handle is required')

  const search = query.startsWith('@')
    ? `from:${query.slice(1)} -is:retweet`
    : `${query} lang:en -is:retweet`

  const signals = await fetchRecentXSignals(search)
  return {
    summary: `Found ${signals.length} recent X signals for ${query}.`,
    query,
    signals: signals.slice(0, 10),
    recommendedActions: [
      'Generate reply draft',
      'Compare top-performing post angles',
      'Schedule follow-up thread',
    ],
  }
}

async function executeJobIntel(input: Record<string, unknown>) {
  const search = String(input.query || '').trim()
  const location = String(input.location || '').trim().toLowerCase()

  const jobs = await prisma.jobListing.findMany({
    where: {
      status: 'active',
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: { company: true },
    orderBy: { publishedAt: 'desc' },
    take: 30,
  })

  const filtered = location
    ? jobs.filter((job) => `${job.description} ${job.title}`.toLowerCase().includes(location))
    : jobs

  const roleTypes = Array.from(new Set(filtered.map((job) => job.roleType).filter(Boolean)))
  const companies = Array.from(new Set(filtered.map((job) => job.company?.name).filter(Boolean)))
  const tech = Array.from(new Set(filtered.flatMap((job) => job.techStack || []))).slice(0, 12)

  return {
    summary: `Found ${filtered.length} active jobs${search ? ` for "${search}"` : ''}.`,
    query: search || null,
    location: location || null,
    jobs: filtered.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company?.name || 'Unknown',
      roleType: job.roleType,
      seniority: job.seniority,
      contractType: job.contractType,
      techStack: job.techStack,
      applyUrl: job.applyUrl,
      publishedAt: job.publishedAt,
    })),
    clusters: {
      roleTypes,
      companies,
      repeatedSkills: tech,
    },
    nextTools: ['repo-intel', 'creator-intel'],
  }
}

async function executeRepoIntel(input: Record<string, unknown>, userId?: string | null) {
  const details = await fetchGitHubRepoDetails(input)
  const gitlawb = Boolean(input.includeGitlawb) ? await fetchGitlawbContext(userId || null) : []
  return {
    summary: `${details.repository.fullName} has ${details.repository.stars} stars, ${details.repository.forks} forks, and ${details.commits.length} recent commits loaded.`,
    ...details,
    gitlawb,
    nextTools: ['trend-intel', 'x-ops'],
  }
}

export async function executePaidTool(toolId: PaidToolId, input: Record<string, unknown>, userId?: string | null) {
  switch (toolId) {
    case 'trend-intel':
      return executeTrendIntel(input, userId)
    case 'x-ops':
      return executeXOps(input)
    case 'job-intel':
      return executeJobIntel(input)
    case 'repo-intel':
      return executeRepoIntel(input, userId)
  }
}
