import Link from 'next/link'

export const dynamic = 'force-dynamic'

const AGENT_SHORT_ID = 'z6MkpUq1'
const AGENT_DID = 'did:key:z6MkpUq1Aw4mgNwwzhEd4f4eYvrUeizwmoT7NyiBx1e8Z9UY'
const NODE_DID = 'did:key:z6Mkicjkc95VcFx38Xg2SvFV2ENsu3dLDoWborjPGVodHXoH'
const PEER_ID = '12D3KooWJ8FTHLfbEkXprCACu7qhBazEKzr3ber4JQ3KsGHiRHAe'
const REPO_NAME = 'agentbot-opensource'
const PROFILE_URL = `https://gitlawb.com/${AGENT_SHORT_ID}`
const REPO_URL = `https://gitlawb.com/node/repos/${AGENT_SHORT_ID}/${REPO_NAME}`
const NETWORK_URL = 'https://gitlawb.com/node/network'
const TERMINAL_URL = 'https://gitlawbterminal.com'
const GITHUB_REPO_URL = 'https://github.com/Eskyee/agentbot-opensource'
const GITHUB_API_URL = 'https://api.github.com/repos/Eskyee/agentbot-opensource'

type TerminalData = {
  terminal: {
    repositories: string | null
    activeAgents: string | null
    liveNodes: string | null
    gatewayCalls: string | null
    activeKeys: string | null
    uptime: string | null
    latency: string | null
    tokensServed: string | null
  }
  agent: {
    repos: string | null
    pushes: string | null
    trustScore: string | null
    trustLevel: string | null
  }
  repo: {
    stars: string | null
    replication: string | null
    latest: string | null
    updated: string | null
  }
  github: {
    stars: string | null
    forks: string | null
    pushedAt: string | null
  }
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
  const match = text.match(pattern)
  return match?.[1]?.trim() || null
}

function cleanZero(value: string | null) {
  if (!value) return null
  return /^0+$/.test(value.replace(/,/g, '')) ? null : value
}

function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function uniqueGitlawbNodeCount(text: string) {
  const hosts = new Set(text.match(/node[0-9]?\.gitlawb\.com/gi) || [])
  return hosts.size ? String(hosts.size) : null
}

async function getTerminalData(): Promise<TerminalData> {
  const [terminalResult, agentResult, repoResult, networkResult, githubResult] = await Promise.allSettled([
    fetchText(TERMINAL_URL),
    fetchText(PROFILE_URL),
    fetchText(REPO_URL),
    fetchText(NETWORK_URL),
    fetchJson<{ stargazers_count?: number; forks_count?: number; pushed_at?: string }>(GITHUB_API_URL),
  ])

  const terminalText = terminalResult.status === 'fulfilled' ? visibleText(terminalResult.value) : ''
  const agentText = agentResult.status === 'fulfilled' ? visibleText(agentResult.value) : ''
  const repoText = repoResult.status === 'fulfilled' ? visibleText(repoResult.value) : ''
  const networkText = networkResult.status === 'fulfilled' ? visibleText(networkResult.value) : ''
  const github = githubResult.status === 'fulfilled' ? githubResult.value : {}
  const liveNodeCount = uniqueGitlawbNodeCount(networkText)

  return {
    terminal: {
      repositories: cleanZero(firstMatch(terminalText, /Repositories\s+([\d,]+)/i)),
      activeAgents: cleanZero(firstMatch(terminalText, /Active Agents\s+([\d,]+)/i)),
      liveNodes: liveNodeCount || cleanZero(firstMatch(terminalText, /Live Nodes\s+([\d,]+)/i) || firstMatch(terminalText, /([\d,]+)\s+Live Nodes/i)),
      gatewayCalls: cleanZero(firstMatch(terminalText, /([\d,]+)\s+calls routed/i)),
      activeKeys: cleanZero(firstMatch(terminalText, /([\d,]+)\s+active keys/i)),
      uptime: firstMatch(terminalText, /([\d.]+%)\s+uptime/i),
      latency: firstMatch(terminalText, /([\d.]+s)\s+avg latency/i),
      tokensServed: firstMatch(terminalText, /([\d.]+M)\s+tokens served/i),
    },
    agent: {
      repos: firstMatch(agentText, /repos\s+([\d,]+)/i),
      pushes: firstMatch(agentText, /level:\s+[a-z]+\s+([\d,]+)\s+pushes/i) || firstMatch(agentText, /([\d,]+)\s+pushes/i),
      trustScore: firstMatch(agentText, /trust score\s+([\d.]+)/i),
      trustLevel: firstMatch(agentText, /level:\s+([a-z]+)/i) || firstMatch(agentText, /([a-z]+)\s+trust level/i),
    },
    repo: {
      stars: firstMatch(repoText, /stars\s+([\d,]+)/i),
      replication: firstMatch(repoText, /replicated\s+([\d/]+)/i),
      latest: firstMatch(repoText, /latest\s+([a-f0-9]{7,12})/i),
      updated: firstMatch(repoText, /updated:\s+([^ ]+\s+ago|[A-Z][a-z]+\s+\d{1,2},\s+\d{4})/i),
    },
    github: {
      stars: typeof github.stargazers_count === 'number' ? String(github.stargazers_count) : null,
      forks: typeof github.forks_count === 'number' ? String(github.forks_count) : null,
      pushedAt: formatDate(github.pushed_at || null),
    },
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

export default async function AgentbotGitlawbTerminalPage() {
  const data = await getTerminalData()
  const updated = new Date().toISOString()

  return (
    <main className="min-h-screen bg-black px-5 py-8 font-mono text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex flex-col gap-3 border border-zinc-900 bg-zinc-950/40 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-bold lowercase tracking-tight">agentbot terminal</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">live gitlawb network monitor</div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-widest">
            <span className="inline-flex items-center gap-2 text-lime-300">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
              live
            </span>
            <a href={PROFILE_URL} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white">profile ↗</a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white">repo ↗</a>
            <a href={TERMINAL_URL} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white">source ↗</a>
          </div>
        </header>

        <section className="mb-4 grid gap-px bg-zinc-900 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="repositories" value={data.terminal.repositories || data.agent.repos} />
          <StatCard label="active agents" value={data.terminal.activeAgents} />
          <StatCard label="live nodes" value={data.terminal.liveNodes} />
          <StatCard label="gateway calls" value={data.terminal.gatewayCalls} />
          <StatCard label="github stars" value={data.github.stars} href={GITHUB_REPO_URL} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="border border-zinc-900 bg-zinc-950/30">
            <div className="border-b border-zinc-900 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-cyan-300">$ gl agent inspect {AGENT_SHORT_ID}</div>
            </div>
            <DataRow label="agent did" value={AGENT_DID} />
            <DataRow label="node did" value={NODE_DID} />
            <DataRow label="p2p peer id" value={PEER_ID} />
            <DataRow label="trust score" value={data.agent.trustScore} />
            <DataRow label="trust level" value={data.agent.trustLevel} />
            <DataRow label="pushes" value={data.agent.pushes} />
          </div>

          <div className="border border-zinc-900 bg-zinc-950/30">
            <div className="border-b border-zinc-900 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest text-fuchsia-300">$ gl repo show {AGENT_SHORT_ID}/{REPO_NAME}</div>
            </div>
            <DataRow label="replication" value={data.repo.replication} />
            <DataRow label="gitlawb stars" value={data.repo.stars} />
            <DataRow label="github repo" value="Eskyee/agentbot-opensource" href={GITHUB_REPO_URL} />
            <DataRow label="github stars" value={data.github.stars} href={GITHUB_REPO_URL} />
            <DataRow label="github forks" value={data.github.forks} href={GITHUB_REPO_URL} />
            <DataRow label="latest commit" value={data.repo.latest} />
            <DataRow label="updated" value={data.repo.updated || data.github.pushedAt} />
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
          <div className="border border-zinc-900 bg-zinc-950/30 p-4">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">OpenGateway</div>
            <code className="block break-all border border-zinc-900 bg-black p-3 text-xs text-zinc-300">
              https://agentbot.sh/v1
            </code>
            <div className="mt-4 grid gap-px bg-zinc-900 sm:grid-cols-2">
              <StatCard label="active keys" value={data.terminal.activeKeys} />
              <StatCard label="uptime" value={data.terminal.uptime} />
              <StatCard label="avg latency" value={data.terminal.latency} />
              <StatCard label="tokens served" value={data.terminal.tokensServed} />
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
                ['GitLawb Network', '/dashboard/gitlawb-network'],
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
