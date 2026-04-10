import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Coins, ExternalLink, Waves } from 'lucide-react'
import { COMMUNITY_TOKEN, getCommunityTokenStats } from '@/app/lib/communityTokenStats'

export const metadata: Metadata = {
  title: 'AGENTBOT Token | $AGENTBOT',
  description: 'AGENTBOT token surfaces across Base and Solana. Track the live community Solana token and official Agentbot ecosystem links.',
  openGraph: {
    title: 'AGENTBOT Token | $AGENTBOT',
    description: 'Track the live community-run Solana token and official Agentbot token surfaces.',
    images: ['/og-image.svg'],
  },
}

export const dynamic = 'force-dynamic'

function formatUsd(n: number | null): string {
  if (n === null || n === undefined) return '—'
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(2) + 'K'
  if (n >= 1) return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (n >= 0.01) return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  if (n >= 0.0001) return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 8 })
}

function formatUsdMoney(n: number | null): string {
  if (n === null || n === undefined) return '$0.00'
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(2) + 'K'
  if (n >= 1) return '$' + n.toFixed(2)
  if (n >= 0.01) return '$' + n.toFixed(4)
  return '$0.00'
}

function formatSupply(n: number): string {
  return n.toLocaleString()
}

function formatUsdExact(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 8 })
}

function formatNative(n: number | null): string {
  if (n === null || n === undefined) return '—'
  if (n >= 1) return `${n.toFixed(4)} SOL`
  return `${n.toFixed(8)} SOL`
}

function formatHolders(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString()
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">{label}</div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-white">{value}</div>
      {detail ? <div className="mt-2 text-xs text-zinc-500">{detail}</div> : null}
    </div>
  )
}

export default async function TokenPage() {
  const stats = await getCommunityTokenStats()

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <span className="block text-[10px] uppercase tracking-[0.24em] text-zinc-600">Token Surface</span>

            <h1 className="text-5xl font-bold uppercase leading-none tracking-tighter md:text-7xl">
              Agentbot
              <br />
              <span className="text-zinc-700">Token</span>
            </h1>

            <p className="max-w-2xl text-sm leading-7 text-zinc-400">
              The Solana <span className="text-white">$AGENTBOT</span> token is community-run. Agentbot builds the
              platform, while the market belongs to the community. The live trading stats below refresh from public
              market data so the page stays current instead of drifting.
            </p>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Community Token</div>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                We did not launch this Solana token. The community created it on Pump.fun. Agentbot does not control
                supply, treasury, or trading activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={COMMUNITY_TOKEN.pumpFunUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200 transition-colors hover:border-blue-400/60 hover:text-white"
              >
                Trade on Pump.fun
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href={stats.pairUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
              >
                View Live Chart
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Community Market</div>
                <div className="mt-2 text-2xl font-bold uppercase tracking-tight text-white">{COMMUNITY_TOKEN.symbol}</div>
              </div>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                stats.status === 'GRADUATED'
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                  : 'border-amber-400/30 bg-amber-400/10 text-amber-200'
              }`}>
                {stats.status}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Token Address</div>
                <code className="mt-2 block break-all rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-blue-300">
                  {COMMUNITY_TOKEN.address}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Progress</div>
                  <div className="mt-2 text-xl font-bold text-white">
                    {stats.progress === null ? '—' : `${stats.progress}%`}
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Updated</div>
                  <div className="mt-2 text-sm font-bold text-white">{formatTimestamp(stats.updatedAt)}</div>
                </div>
              </div>

              <div className="text-xs leading-6 text-zinc-500">{stats.statusNote}</div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 text-[10px] uppercase tracking-[0.24em] text-zinc-600">Live Stats</div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
            <StatCard label="Status" value={stats.status} detail={stats.statusNote} />
            <StatCard label="Progress" value={stats.progress === null ? '—' : `${stats.progress}%`} />
            <StatCard
              label="Price (USD)"
              value={formatUsdMoney(stats.priceUsd)}
              detail={`Exact: ${formatUsdExact(stats.priceUsd)} · ${formatNative(stats.priceNative)}`}
            />
            <StatCard label="Market Cap" value={formatUsd(stats.marketCapUsd)} />
            <StatCard label="24h Volume" value={formatUsd(stats.volume24hUsd)} />
            <StatCard
              label="Holders"
              value={formatHolders(stats.holders)}
              detail={stats.holdersSource === 'solscan' ? 'Live via Solscan' : 'Explorer snapshot'}
            />
            <StatCard label="Liquidity" value={formatUsd(stats.liquidityUsd)} />
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Overview</div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Name</div>
                <div className="mt-2 text-sm font-bold uppercase text-white">{COMMUNITY_TOKEN.name}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Symbol</div>
                <div className="mt-2 text-sm font-bold uppercase text-white">{COMMUNITY_TOKEN.symbol}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Network</div>
                <div className="mt-2 text-sm font-bold uppercase text-white">{COMMUNITY_TOKEN.network}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Primary Venue</div>
                <div className="mt-2 text-sm font-bold uppercase text-white">{COMMUNITY_TOKEN.dex}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Max Total Supply</div>
                <div className="mt-2 text-sm font-bold text-white">{formatSupply(COMMUNITY_TOKEN.maxTotalSupply)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Circulating Supply</div>
                <div className="mt-2 text-sm font-bold text-white">{formatSupply(COMMUNITY_TOKEN.circulatingSupply)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Decimals</div>
                <div className="mt-2 text-sm font-bold text-white">{COMMUNITY_TOKEN.decimals}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Token Extension</div>
                <div className="mt-2 text-sm font-bold text-white">{COMMUNITY_TOKEN.tokenExtension ? 'True' : 'False'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Owner Program</div>
                <div className="mt-2 break-all text-sm text-zinc-300">{COMMUNITY_TOKEN.ownerProgram}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Creation Time</div>
                <div className="mt-2 text-sm font-bold text-white">{COMMUNITY_TOKEN.creationTimeLabel}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Pair Source</div>
                <div className="mt-2 text-sm text-zinc-300">
                  {stats.pairAddress ? (
                    <span className="break-all">{stats.pairAddress}</span>
                  ) : (
                    <span>Using token-level market lookup.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Track Live</div>
            <div className="mt-5 space-y-3">
              {[
                { label: 'Pump.fun', href: COMMUNITY_TOKEN.pumpFunUrl, icon: Waves },
                { label: 'DexScreener Pair', href: stats.pairUrl, icon: Coins },
                { label: 'Solscan Token', href: COMMUNITY_TOKEN.solscanUrl, icon: ExternalLink },
                { label: 'Solscan Pair', href: COMMUNITY_TOKEN.solscanPairUrl, icon: ExternalLink },
                { label: 'OKLink', href: COMMUNITY_TOKEN.oklinkUrl, icon: ExternalLink },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-sm text-zinc-200 transition-colors hover:border-zinc-700 hover:text-white"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-zinc-500" />
                      {item.label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Official Links</div>
              <div className="mt-3 text-xl font-bold uppercase tracking-tight text-white">Agentbot Surfaces</div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                These are the official Agentbot links we can stand behind. The live token market above is the
                community-run Solana token surface.
              </p>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: 'Pump.fun Listing',
                  href: COMMUNITY_TOKEN.pumpFunUrl,
                },
                {
                  label: 'Bankr Profile',
                  href: 'https://bankr.bot/agents/agentbot',
                },
                {
                  label: 'Agentbot Platform',
                  href: 'https://agentbot.raveculture.xyz',
                },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-sm text-zinc-200 transition-colors hover:border-zinc-700 hover:text-white"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
