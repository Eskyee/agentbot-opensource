/**
 * mcp/handlers.ts — Real tool handler implementations
 *
 * Replaces the mock executeTool() with actual API calls.
 * Each handler is a pure async function taking params and returning results.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Handler = (params: Record<string, unknown>) => Promise<unknown>
export type HandlerMap = Record<string, Handler>

interface SearchHit {
  title: string
  url: string
  snippet: string
}

interface PageContent {
  url: string
  title: string
  content: string
  length: number
}

// ---------------------------------------------------------------------------
// websearch.search — Brave Search API (or fallback to DuckDuckGo HTML)
// ---------------------------------------------------------------------------

async function websearchSearch(params: Record<string, unknown>): Promise<{
  query: string
  results: SearchHit[]
  count: number
}> {
  const query = String(params.query ?? '')
  const limit = Number(params.limit ?? 5)

  if (!query) throw new Error('websearch.search: "query" is required')

  // Try Brave Search API first (if key is available)
  const braveKey = process.env.BRAVE_SEARCH_API_KEY
  if (braveKey) {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`,
      {
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': braveKey,
        },
      }
    )
    if (res.ok) {
      const data = await res.json() as {
        web?: { results?: Array<{ title: string; url: string; description: string }> }
      }
      const results: SearchHit[] = (data.web?.results ?? []).slice(0, limit).map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
      }))
      return { query, results, count: results.length }
    }
  }

  // Fallback: DuckDuckGo Instant Answer API (limited but free, no key needed)
  const ddgRes = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
  )
  if (ddgRes.ok) {
    const ddg = await ddgRes.json() as {
      AbstractText?: string
      AbstractURL?: string
      Heading?: string
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>
    }
    const results: SearchHit[] = []

    if (ddg.AbstractText && ddg.AbstractURL) {
      results.push({
        title: ddg.Heading ?? query,
        url: ddg.AbstractURL,
        snippet: ddg.AbstractText,
      })
    }

    for (const topic of ddg.RelatedTopics ?? []) {
      if (results.length >= limit) break
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.slice(0, 80),
          url: topic.FirstURL,
          snippet: topic.Text,
        })
      }
    }

    return { query, results, count: results.length }
  }

  throw new Error('websearch.search: all search providers failed')
}

// ---------------------------------------------------------------------------
// websearch.fetch_page — fetch and extract readable content
// ---------------------------------------------------------------------------

async function websearchFetchPage(params: Record<string, unknown>): Promise<PageContent> {
  const url = String(params.url ?? '')
  if (!url) throw new Error('websearch.fetch_page: "url" is required')

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Agentbot/1.0 (MCP websearch.fetch_page)',
      Accept: 'text/html,application/xhtml+xml,text/plain,*/*',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    throw new Error(`websearch.fetch_page: HTTP ${res.status} for ${url}`)
  }

  const contentType = res.headers.get('content-type') ?? ''
  const raw = await res.text()

  // Strip HTML tags for a rough text extraction
  let content: string
  if (contentType.includes('html')) {
    content = raw
      // Remove script/style blocks
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode common entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim()
  } else {
    content = raw.trim()
  }

  // Extract title from HTML if present
  const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, '').trim()
    : url

  // Truncate to ~8KB to keep responses manageable
  const maxLen = 8_000
  if (content.length > maxLen) {
    content = content.slice(0, maxLen) + '\n\n[truncated]'
  }

  return { url, title, content, length: content.length }
}

// ---------------------------------------------------------------------------
// context7.get_docs — fetch library documentation via Context7 API
// ---------------------------------------------------------------------------

async function context7GetDocs(params: Record<string, unknown>): Promise<{
  library: string
  topic: string | undefined
  docs: string
  source: string
}> {
  const library = String(params.library ?? '')
  const topic = params.topic ? String(params.topic) : undefined

  if (!library) throw new Error('context7.get_docs: "library" is required')

  // Context7 MCP public endpoint
  // Resolves library ID then fetches docs
  const searchUrl = `https://context7.com/api/v1/search?query=${encodeURIComponent(library)}&limit=1`
  const searchRes = await fetch(searchUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })

  if (!searchRes.ok) {
    // Fallback: search GitHub repos for README
    return await fallbackGithubDocs(library, topic)
  }

  const searchData = await searchRes.json() as {
    results?: Array<{ id?: string; name?: string; full_name?: string }>
  }
  const libId = searchData.results?.[0]?.id ?? searchData.results?.[0]?.full_name

  if (!libId) {
    return await fallbackGithubDocs(library, topic)
  }

  // Fetch docs from Context7
  const docsUrl = `https://context7.com/api/v1/docs/${encodeURIComponent(libId)}${topic ? `?topic=${encodeURIComponent(topic)}` : ''}`
  const docsRes = await fetch(docsUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  })

  if (!docsRes.ok) {
    return await fallbackGithubDocs(library, topic)
  }

  const docsData = await docsRes.json() as { content?: string; docs?: string; text?: string }
  const docs = docsData.content ?? docsData.docs ?? docsData.text ?? 'No documentation found'

  return {
    library,
    topic,
    docs: docs.slice(0, 12_000),
    source: `context7:${libId}`,
  }
}

async function fallbackGithubDocs(
  library: string,
  topic?: string
): Promise<{ library: string; topic: string | undefined; docs: string; source: string }> {
  // Try GitHub search for the repo README
  const ghToken = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' }
  if (ghToken) headers.Authorization = `Bearer ${ghToken}`

  const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(library)}&sort=stars&per_page=1`
  const res = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(10_000) })

  if (!res.ok) {
    return {
      library,
      topic,
      docs: `Could not find documentation for "${library}". Context7 and GitHub search both failed.`,
      source: 'none',
    }
  }

  const data = await res.json() as { items?: Array<{ full_name: string; description?: string }> }
  const repo = data.items?.[0]

  if (!repo) {
    return {
      library,
      topic,
      docs: `No repository found for "${library}".`,
      source: 'none',
    }
  }

  // Fetch README
  const readmeUrl = `https://api.github.com/repos/${repo.full_name}/readme`
  const readmeRes = await fetch(readmeUrl, { headers, signal: AbortSignal.timeout(10_000) })

  if (!readmeRes.ok) {
    return {
      library,
      topic,
      docs: `Found repo ${repo.full_name} but could not fetch README. Description: ${repo.description ?? 'none'}`,
      source: `github:${repo.full_name}`,
    }
  }

  const readmeData = await readmeRes.json() as { content?: string; encoding?: string }
  let readme = ''
  if (readmeData.content && readmeData.encoding === 'base64') {
    readme = Buffer.from(readmeData.content, 'base64').toString('utf-8')
  }

  // Filter by topic if provided
  let docs = readme
  if (topic && readme) {
    const sections = readme.split(/(?=^#{1,3}\s)/m)
    const relevant = sections.filter(s =>
      s.toLowerCase().includes(topic.toLowerCase())
    )
    if (relevant.length > 0) {
      docs = relevant.join('\n\n')
    }
  }

  return {
    library,
    topic,
    docs: docs.slice(0, 12_000) || `README for ${repo.full_name} is empty.`,
    source: `github:${repo.full_name}`,
  }
}

// ---------------------------------------------------------------------------
// grep_app.search_code — search GitHub code via API
// ---------------------------------------------------------------------------

async function grepAppSearchCode(params: Record<string, unknown>): Promise<{
  query: string
  language: string | undefined
  results: Array<{ repository: string; path: string; url: string; snippet: string }>
  count: number
}> {
  const query = String(params.query ?? '')
  const language = params.language ? String(params.language) : undefined

  if (!query) throw new Error('grep_app.search_code: "query" is required')

  const ghToken = process.env.GITHUB_TOKEN
  if (!ghToken) {
    throw new Error(
      'grep_app.search_code: GITHUB_TOKEN is required for code search. ' +
      'Set it in your environment.'
    )
  }

  // Build search query
  let searchQuery = query
  if (language) {
    searchQuery += ` language:${language}`
  }

  const url = `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}&per_page=10`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${ghToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (res.status === 403) {
    // Rate limited
    const reset = res.headers.get('x-ratelimit-reset')
    const resetTime = reset ? new Date(Number(reset) * 1000).toISOString() : 'unknown'
    throw new Error(
      `grep_app.search_code: GitHub API rate limited. Resets at ${resetTime}. ` +
      'Consider using a GitHub App token for higher limits.'
    )
  }

  if (!res.ok) {
    throw new Error(`grep_app.search_code: GitHub API returned ${res.status}`)
  }

  const data = await res.json() as {
    items?: Array<{
      repository: { full_name: string }
      path: string
      html_url: string
      text_matches?: Array<{ fragment?: string }>
    }>
    total_count?: number
  }

  const results = (data.items ?? []).map(item => ({
    repository: item.repository.full_name,
    path: item.path,
    url: item.html_url,
    snippet: item.text_matches?.[0]?.fragment?.replace(/<[^>]+>/g, '').trim() ?? '',
  }))

  return {
    query: searchQuery,
    language,
    results,
    count: results.length,
  }
}

// ---------------------------------------------------------------------------
// Handler registry
// ---------------------------------------------------------------------------

const HANDLER_MAP: Record<string, HandlerMap> = {
  websearch: {
    search: websearchSearch,
    fetch_page: websearchFetchPage,
  },
  context7: {
    get_docs: context7GetDocs,
  },
  grep_app: {
    search_code: grepAppSearchCode,
  },
}

/**
 * Get a handler function for a skill tool.
 *
 * @param skillId  - The skill/MCP namespace (e.g. "websearch", "context7")
 * @param toolName - The tool name (e.g. "search", "get_docs")
 * @returns The handler function, or null if not found
 */
export function getHandler(skillId: string, toolName: string): Handler | null {
  const skillHandlers = HANDLER_MAP[skillId]
  if (!skillHandlers) return null
  return skillHandlers[toolName] ?? null
}

/**
 * Register a custom handler at runtime (for plugins, user skills, etc.)
 */
export function registerHandler(skillId: string, toolName: string, handler: Handler): void {
  if (!HANDLER_MAP[skillId]) {
    HANDLER_MAP[skillId] = {}
  }
  HANDLER_MAP[skillId][toolName] = handler
}

/**
 * List all registered handler names (for diagnostics)
 */
export function listHandlers(): Array<{ skillId: string; toolName: string }> {
  const out: Array<{ skillId: string; toolName: string }> = []
  for (const [skillId, tools] of Object.entries(HANDLER_MAP)) {
    for (const toolName of Object.keys(tools)) {
      out.push({ skillId, toolName })
    }
  }
  return out
}
