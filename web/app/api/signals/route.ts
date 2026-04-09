import { NextResponse } from 'next/server'

interface Signal {
  id: string
  platform: 'reddit' | 'twitter' | 'hacker-news' | 'discord'
  author: string
  content: string
  url: string
  upvotes: number
  comments: number
  date: string
  relevance: 'high' | 'medium' | 'low'
  tags: string[]
}

// Hacker News — free API, no auth
async function fetchHNSignals(): Promise<Signal[]> {
  try {
    // Get top stories
    const topRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
      signal: AbortSignal.timeout(8000),
    })
    const topIds: number[] = await topRes.json()

    // Fetch first 30 stories in parallel
    const stories = await Promise.all(
      topIds.slice(0, 30).map(async id => {
        try {
          const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
            signal: AbortSignal.timeout(5000),
          })
          return res.json()
        } catch { return null }
      })
    )

    // Filter for AI/agent related keywords
    const keywords = ['ai', 'agent', 'llm', 'gpt', 'claude', 'openai', 'anthropic', 'model', 'chatbot', 'automation', 'autonomous', 'mcp', 'langchain', 'tool', 'api']
    const signals: Signal[] = []

    for (const story of stories) {
      if (!story || !story.title) continue
      const titleLower = story.title.toLowerCase()
      const matchCount = keywords.filter(k => titleLower.includes(k)).length
      if (matchCount === 0) continue

      const relevance = matchCount >= 2 || (story.score || 0) > 300 ? 'high' : matchCount >= 1 ? 'medium' : 'low'
      const tags = keywords.filter(k => titleLower.includes(k))

      signals.push({
        id: `hn-${story.id}`,
        platform: 'hacker-news',
        author: story.by || 'anonymous',
        content: story.title + (story.text ? ` — ${story.text.replace(/<[^>]*>/g, '').slice(0, 200)}` : ''),
        url: `https://news.ycombinator.com/item?id=${story.id}`,
        upvotes: story.score || 0,
        comments: story.descendants || 0,
        date: new Date((story.time || 0) * 1000).toISOString().split('T')[0],
        relevance,
        tags: tags.slice(0, 3),
      })
    }

    return signals.sort((a, b) => b.upvotes - a.upvotes).slice(0, 10)
  } catch (e) {
    console.error('HN fetch failed:', e)
    return []
  }
}

// Reddit — JSON API, no auth needed for public subreddits
async function fetchRedditSignals(): Promise<Signal[]> {
  const subreddits = ['artificial', 'LocalLLaMA', 'MachineLearning', 'singularity', 'OpenAI']
  const signals: Signal[] = []

  try {
    const results = await Promise.all(
      subreddits.map(async sub => {
        try {
          const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=8`, {
            signal: AbortSignal.timeout(8000),
            headers: { 'User-Agent': 'Agentbot-Signals/1.0' },
          })
          const json = await res.json()
          return json?.data?.children || []
        } catch { return [] }
      })
    )

    const keywords = ['ai agent', 'llm', 'gpt', 'claude', 'autonomous', 'agent framework', 'mcp', 'tool use', 'ai assistant', 'langchain', 'openai', 'anthropic', 'memory', 'rag', 'embedding']

    for (const posts of results) {
      for (const post of posts) {
        const data = post?.data
        if (!data) continue
        const titleLower = (data.title || '').toLowerCase()
        const selfLower = (data.selftext || '').toLowerCase()
        const combined = `${titleLower} ${selfLower}`
        const matchCount = keywords.filter(k => combined.includes(k)).length
        if (matchCount === 0) continue

        const relevance = matchCount >= 2 || (data.ups || 0) > 500 ? 'high' : matchCount >= 1 ? 'medium' : 'low'
        const tags = keywords.filter(k => combined.includes(k)).slice(0, 3)

        signals.push({
          id: `reddit-${data.id}`,
          platform: 'reddit',
          author: `u/${data.author || 'unknown'}`,
          content: data.title + (data.selftext ? ` — ${data.selftext.slice(0, 150)}` : ''),
          url: `https://reddit.com${data.permalink}`,
          upvotes: data.ups || 0,
          comments: data.num_comments || 0,
          date: new Date((data.created_utc || 0) * 1000).toISOString().split('T')[0],
          relevance,
          tags,
        })
      }
    }

    return signals.sort((a, b) => b.upvotes - a.upvotes).slice(0, 10)
  } catch (e) {
    console.error('Reddit fetch failed:', e)
    return []
  }
}

export async function GET() {
  const [hnSignals, redditSignals] = await Promise.all([
    fetchHNSignals(),
    fetchRedditSignals(),
  ])

  // Deduplicate by content similarity
  const all = [...hnSignals, ...redditSignals]
  const seen = new Set<string>()
  const unique: Signal[] = []
  for (const sig of all) {
    const key = sig.content.slice(0, 80).toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(sig)
    }
  }

  // Sort by upvotes
  unique.sort((a, b) => b.upvotes - a.upvotes)

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    sources: ['hacker-news', 'reddit'],
    total: unique.length,
    signals: unique.slice(0, 20),
  })
}
