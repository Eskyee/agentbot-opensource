import Link from 'next/link'

export const dynamic = 'force-dynamic'

const AGENT_SHORT_ID = 'z6MkpUq1'
const AGENT_DID = 'did:key:z6MkpUq1Aw4mgNwwzhEd4f4eYvrUeizwmoT7NyiBx1e8Z9UY'
const NODE_DID = 'did:key:z6Mkicjkc95VcFx38Xg2SvFV2ENsu3dLDoWborjPGVodHXoH'
const PEER_ID = '12D3KooWJ8FTHLfbEkXprCACu7qhBazEKzr3ber4JQ3KsGHiRHAe'
const REPO_NAME = 'agentbot-opensource'
const PROFILE_URL = `https://gitlawb.com/${AGENT_SHORT_ID}`
const REPO_URL = `https://gitlawb.com/node/repos/${AGENT_SHORT_ID}/${REPO_NAME}`
const TERMINAL_URL = 'https://gitlawbterminal.com'
const REPOS_API_URL = 'https://gitlawbterminal.com/api/repos'
const LEADERBOARD_API_URL = 'https://gitlawbterminal.com/api/leaderboard'
const GITHUB_REPO_URL = 'https://github.com/Eskyee/agentbot-opensource'
const GITHUB_API_URL = 'https://api.github.com/repos/Eskyee/agentbot-opensource'
const NODE_APIS = [
  'https://node.gitlawb.com/api/v1/repos',
  'https://node2.gitlawb.com/api/v1/repos',
  'https://node3.gitlawb.com/api/v1/repos',
]

type GitlawbRepo = {
  name: string
  owner_did: string
  description: string | null
  default_branch: string | null
  star_count: number
  updated_at: string
}

type LeaderboardRow = {
  did: string
  repo_count: number
  total_stars: number
  repos: string[]
  score: number
}

type GithubRepo = {
  stargazers_count?: number
  forks_count?: number
  pushed_at?: string
  default_branch?: string
  open_issues_count?: number
}

type SourceState = {
  label: string
  status: 'live' | 'error'
  detail: string
}

type TerminalData = {
  terminal: {
    repositories: string | null
    activeAgents: string | null
    liveNodes: string | null
  }
  agent: {
    profileRepos: string | null
    indexedRepos: string | null
    pushes: string | null
    trustScore: string | null
    trustLevel: string | null
    leaderboardScore: string | null
  }
  repo: {
    gitlawbStars: string | null
    githubStars: string | null
    githubForks: string | null
    branch: string | null
    updated: string | null
    description: string | null
  }
  sources: SourceState[]
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'user-agent': 'AgentbotTerminal/1.0 (+https://agentbot.sh)' },
  })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.text()
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'user-agent': 'AgentbotTerminal/1.0 (+https://agentbot.sh)' },
  })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.json() as Promise<T>
}

async function checkUrl(url: string): Promise<boolean> {
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(4500),
    headers: { 'user-agent': 'AgentbotTerminal/1.0 (+https://agentbot.sh)' },
  })
  return response.ok
}

function visibleText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstMatch(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1]?.trim() || null
}

function formatInteger(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('en-US') : null
}

function formatDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function source(label: string, ok: boolean, detail: string): SourceState {
  return { label, status: ok ? 'live' : 'error', detail }
}

async function getTerminalData(): Promise<TerminalData> {
  const [reposResult, leaderboardResult, profileResult, githubResult, ...nodeResults] = await Promise.allSettled([
    fetchJson<GitlawbRepo[]>(REPOS_API_URL),
    fetchJson<{ leaderboard: LeaderboardRow[] }>(LEADERBOARD_API_URL),
    fetchText(PROFILE_URL),
    fetchJson<GithubRepo>(GITHUB_API_URL),
    ...NODE_APIS.map((url) => checkUrl(url)),
  ])

  const repos = reposResult.status === 'fulfilled' && Array.isArray(reposResult.value) ? reposResult.value : []
  const leaderboard = leaderboardResult.status === 'fulfilled' && Array.isArray(leaderboardResult.value.leaderboard)
    ? leaderboardResult.value.leaderboard
    : []
  const profileText = profileResult.status === 'fulfilled' ? visibleText(profileResult.value) : ''
  const github = githubResult.status === 'fulfilled' ? githubResult.value : {}
  const nodeLiveCount = nodeResults.filter((result) => result.status === 'fulfilled').length
  const agentRepos = repos.filter((repo) => repo.owner_did === AGENT_DID)
  const agentRepo = agentRepos.find((repo) => repo.name === REPO_NAME)
  const agentLeaderboard = leaderboard.find((row) => row.did === AGENT_DID)

  return {
    terminal: {
      repositories: formatInteger(repos.length || null),
      activeAgents: formatInteger(leaderboard.length || null),
      liveNodes: `${nodeLiveCount}/${NODE_APIS.length}`,
    },
    agent: {
      profileRepos: firstMatch(profileText, /repos\s+([\d,]+)/i),
      indexedRepos: formatInteger(agentRepos.length || agentLeaderboard?.repo_count || null),
      pushes: firstMatch(profileText, /level:\s+[a-z]+\s+([\d,]+)\s+pushes/i) || firstMatch(profileText, /([\d,]+)\s+pushes/i),
      trustScore: firstMatch(profileText, /trust score\s+([\d.]+)/i),
      trustLevel: firstMatch(profileText, /level:\s+([a-z]+)/i) || firstMatch(profileText, /([a-z]+)\s+trust level/i),
      leaderboardScore: formatInteger(agentLeaderboard?.score),
    },
    repo: {
      gitlawbStars: formatInteger(agentRepo?.star_count),
      githubStars: formatInteger(github.stargazers_count),
      githubForks: formatInteger(github.forks_count),
      branch: agentRepo?.default_branch || github.default_branch || null,
      updated: formatDate(agentRepo?.updated_at || github.pushed_at),
      description: agentRepo?.description || null,
    },
    sources: [
      source('terminal repo api', reposResult.status === 'fulfilled', reposResult.status === 'fulfilled' ? `${repos.length.toLocaleString('en-US')} repos` : 'fetch failed'),
      source('terminal leaderboard api', leaderboardResult.status === 'fulfilled', leaderboardResult.status === 'fulfilled' ? `${leaderboard.length.toLocaleString('en-US')} agents` : 'fetch failed'),
      source('gitlawb profile', profileResult.status === 'fulfilled', profileResult.status === 'fulfilled' ? PROFILE_URL : 'fetch failed'),
      source('github api', githubResult.status === 'fulfilled', githubResult.status === 'fulfilled' ? 'Eskyee/agentbot-opensource' : 'fetch failed'),
      source('node api quorum', nodeLiveCount > 0, `${nodeLiveCount}/${NODE_APIS.length} online`),
    ],
  }
}

function valueOrMissing(value: string | null) {
  return value || 'unavailable'
}

function StatCard({ label, value, href }: { label: string; value: string | null; href?: string }) {
  const content = (
    <div className="border border-zinc-900 bg-black p-4">
      <div className="text-[10px] uppercase tracking-widest text-zinc-600">{label}</div>
      <div className={`mt-3 font-mono text-2xl font-black ${value ? 'text-white' : 'text-zinc-700'}`}>
        {valueOrMissing(value)}
      </div>
    </div>
  )

  if (!href) return content

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block transition-colors hover:border-zinc-700 hover:bg-zinc-950">
      {content}
    </a>
  )
}

function DataRow({ label, value, href }: { label: string; value: string | null; href?: string }) {
  const valueClass = `break-all font-mono text-xs ${value ? 'text-zinc-300' : 'text-zinc-700'}`

  return (
    <div className="grid gap-3 border-b border-zinc-900 px-4 py-3 last:border-b-0 sm:grid-cols-[180px_1fr]">
      <span className="text-[10px] uppercase tracking-widest text-zinc-600">{label}</span>
      {href && value ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={`${valueClass} hover:text-white`}>
          {valueOrMissing(value)} ↗
        </a>
      ) : (
        <span className={valueClass}>{valueOrMissing(value)}</span>
      )}
    </div>
  )
}

export default async function AgentbotTerminalPage() {
  const data = await getTerminalData()
  const updated = new Date().toISOString()

  return (
    <main className="min-h-screen bg-black px-5 py-8 font-mono text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-col gap-3 border border-zinc-900 bg-zinc-950/40 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-bold lowercase tracking-tight">agentbot terminal</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">live network monitor</div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-widest">
            <span className="inline-flex items-center gap-2 text-lime-300">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
              live data
            </span>
            <a href={PROFILE_URL} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white">profile ↗</a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white">repo ↗</a>
            <a href={TERMINAL_URL} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white">terminal source ↗</a>
          </div>
        </header>

        <section className="mb-4 grid gap-px bg-zinc-900 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="network repositories" value={data.terminal.repositories} href={TERMINAL_URL} />
          <StatCard label="network agents" value={data.terminal.activeAgents} href={TERMINAL_URL} />
          <StatCard label="live nodes" value={data.terminal.liveNodes} />
          <StatCard label="gitlawb repo stars" value={data.repo.gitlawbStars} href={REPO_URL} />
          <StatCard label="github stars" value={data.repo.githubStars} href={GITHUB_REPO_URL} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="border border-zinc-900 bg-zinc-950/30">
            <div className="border-b border-zinc-900 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-cyan-300">$ terminal agent inspect {AGENT_SHORT_ID}</div>
            </div>
            <DataRow label="agent did" value={AGENT_DID} />
            <DataRow label="node did" value={NODE_DID} />
            <DataRow label="p2p peer id" value={PEER_ID} />
            <DataRow label="trust score" value={data.agent.trustScore} />
            <DataRow label="trust level" value={data.agent.trustLevel} />
            <DataRow label="profile repos" value={data.agent.profileRepos} href={PROFILE_URL} />
            <DataRow label="indexed repos" value={data.agent.indexedRepos} href={TERMINAL_URL} />
            <DataRow label="profile pushes" value={data.agent.pushes} />
            <DataRow label="leaderboard score" value={data.agent.leaderboardScore} />
          </div>

          <div className="border border-zinc-900 bg-zinc-950/30">
            <div className="border-b border-zinc-900 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-fuchsia-300">$ terminal repo show {AGENT_SHORT_ID}/{REPO_NAME}</div>
            </div>
            <DataRow label="repository" value={`${AGENT_SHORT_ID}/${REPO_NAME}`} href={REPO_URL} />
            <DataRow label="description" value={data.repo.description} />
            <DataRow label="branch" value={data.repo.branch} />
            <DataRow label="gitlawb stars" value={data.repo.gitlawbStars} href={REPO_URL} />
            <DataRow label="github stars" value={data.repo.githubStars} href={GITHUB_REPO_URL} />
            <DataRow label="github forks" value={data.repo.githubForks} href={GITHUB_REPO_URL} />
            <DataRow label="updated" value={data.repo.updated} />
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
          <div className="border border-zinc-900 bg-zinc-950/30 p-4">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Live sources</div>
            <div className="grid gap-px bg-zinc-900">
              {data.sources.map((item) => (
                <div key={item.label} className="grid gap-3 bg-black p-4 sm:grid-cols-[180px_1fr_auto] sm:items-center">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">{item.label}</span>
                  <span className="break-all text-xs text-zinc-400">{item.detail}</span>
                  <span className={`text-[10px] uppercase tracking-widest ${item.status === 'live' ? 'text-lime-300' : 'text-red-400'}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-zinc-900 bg-zinc-950/30 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Agentbot links</div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-700">updated {updated}</div>
            </div>
            <div className="grid gap-px bg-zinc-900 sm:grid-cols-2">
              {[
                ['Playground', '/playground'],
                ['Creator Console', '/dashboard/creator'],
                ['OpenGateway', '/opengateway'],
                ['Network Dashboard', '/dashboard/gitlawb-network'],
                ['Agent Profile', PROFILE_URL],
                ['Repo Mirror', REPO_URL],
              ].map(([label, href]) => (
                href.startsWith('http') ? (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="bg-black p-4 text-xs uppercase tracking-widest text-zinc-400 hover:text-white">
                    {label} ↗
                  </a>
                ) : (
                  <Link key={href} href={href} className="bg-black p-4 text-xs uppercase tracking-widest text-zinc-400 hover:text-white">
                    {label}
                  </Link>
                )
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
