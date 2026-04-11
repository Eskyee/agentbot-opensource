import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Coins, ExternalLink, Waves } from 'lucide-react'
import { BASE_AGENTBOT_TOKEN, getBaseAgentbotTokenLinks } from '@/app/lib/baseAgentbotToken'
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
  if (n >= 0.000001) return '$' + n.toFixed(8)
  if (n > 0) return '$' + n.toFixed(10)
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

function StatCard({
  label,
  value,
  detail,
  compact = false,
}: {
  label: string
  value: string
  detail?: string
  compact?: boolean
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="text-[9px] uppercase tracking-[0.16em] text-zinc-600">{label}</div>
      <div
        className={`mt-2 break-words font-bold tracking-tight text-white ${
          compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
        }`}
      >
        {value}
      </div>
      {detail ? <div className="mt-1.5 break-words text-[10px] leading-4 text-zinc-500">{detail}</div> : null}
    </div>
  )
}

export default async function TokenPage() {
  const stats = await getCommunityTokenStats()
  const baseTokenLinks = getBaseAgentbotTokenLinks()

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

            <figure className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
              <Image
                src="https://indigo-decent-condor-546.mypinata.cloud/ipfs/bafybeicst263mihhveiveb4jghdta5dkrt5nphpgygsux435kn7nlabvje"
                alt="Agentbot community token artwork"
                width={1600}
                height={900}
                className="h-auto w-full object-cover"
                priority
                unoptimized
              />
              <figcaption className="border-t border-zinc-800 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Community-run token supporting the Agentbot platform
              </figcaption>
            </figure>

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

          <div className="space-y-6">
            <div className="min-w-0 overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
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

            <div className="min-w-0 overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">How To Buy</div>
              <div className="mt-3 text-2xl font-bold uppercase tracking-tight text-white">
                Buy {COMMUNITY_TOKEN.symbol} on Solana
              </div>
              <div className="mt-6 space-y-4">
                {[
                  'Get a Solana wallet (Phantom, Solflare, or Backpack).',
                  'Fund it with SOL for the swap and gas fees.',
                  `Go to Pump.fun and search for ${COMMUNITY_TOKEN.symbol} — verify the contract address before swapping.`,
                  'Track your position from the chart and explorer links below.',
                ].map((step, index) => (
                  <div key={index} className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-black p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-[10px] font-bold uppercase text-zinc-400">
                      {index + 1}
                    </div>
                    <div className="text-sm leading-6 text-zinc-300">{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 text-[10px] uppercase tracking-[0.24em] text-zinc-600">Live Stats</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <StatCard label="Status" value={stats.status} detail={stats.statusNote} />
            <StatCard label="Progress" value={stats.progress === null ? '—' : `${stats.progress}%`} />
            <StatCard
              label="Price USD"
              value={formatUsdMoney(stats.priceUsd)}
              detail={formatNative(stats.priceNative)}
              compact
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
          <div className="min-w-0 overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
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

          <div className="min-w-0 overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
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
                    className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-sm text-zinc-200 transition-colors hover:border-zinc-700 hover:text-white"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="h-4 w-4 text-zinc-500" />
                      <span className="break-words">{item.label}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600" />
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mt-12 min-w-0 overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Official Links</div>
              <div className="mt-3 text-xl font-bold uppercase tracking-tight text-white">Agentbot Surfaces</div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                These are the official Agentbot links we can stand behind. The live token market above is the
                community-run Solana token surface. The Base section below covers the official onchain token.
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
                {
                  label: 'Basescan Token',
                  href: baseTokenLinks.explorerUrl || '#',
                },
                {
                  label: 'Base Chart',
                  href: baseTokenLinks.chartUrl || 'https://www.geckoterminal.com/base',
                },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-4 text-sm text-zinc-200 transition-colors hover:border-zinc-700 hover:text-white"
                >
                  <span className="break-words">{item.label}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)]">
          <div className="min-w-0 overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Official Base Token</div>
            <div className="mt-3 text-2xl font-bold uppercase tracking-tight text-white">
              {BASE_AGENTBOT_TOKEN.symbol} on {BASE_AGENTBOT_TOKEN.network}
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              This is the official Base-side token surface for Agentbot. We keep the contract and chart config-driven
              so the page never publishes the wrong Base address by mistake.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Contract"
                value={BASE_AGENTBOT_TOKEN.address || 'Awaiting config'}
                detail={
                  BASE_AGENTBOT_TOKEN.address
                    ? 'Official Base contract'
                    : 'Set NEXT_PUBLIC_AGENTBOT_BASE_TOKEN_ADDRESS to publish the canonical contract.'
                }
                compact
              />
              <StatCard
                label="Holders"
                value={BASE_AGENTBOT_TOKEN.holdersLabel || 'Awaiting config'}
                detail={
                  BASE_AGENTBOT_TOKEN.holdersLabel
                    ? 'Configured Base token holder count'
                    : 'Set NEXT_PUBLIC_AGENTBOT_BASE_TOKEN_HOLDERS_LABEL to show the official holder count.'
                }
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={baseTokenLinks.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-200"
              >
                Buy on Base
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href={baseTokenLinks.chartUrl || 'https://www.geckoterminal.com/base'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
              >
                View Chart
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              {baseTokenLinks.explorerUrl ? (
                <a
                  href={baseTokenLinks.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Basescan
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">How To Buy</div>
            <div className="mt-3 text-2xl font-bold uppercase tracking-tight text-white">
              Buy {BASE_AGENTBOT_TOKEN.symbol} on Base
            </div>
            <div className="mt-6 space-y-4">
              {BASE_AGENTBOT_TOKEN.howToBuy.map((step, index) => (
                <div key={step} className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-black p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-[10px] font-bold uppercase text-zinc-400">
                    {index + 1}
                  </div>
                  <div className="text-sm leading-6 text-zinc-300">{step}</div>
                </div>
              ))}
            </div>
            {!baseTokenLinks.configured ? (
              <p className="mt-4 text-xs leading-6 text-amber-200">
                Base contract and chart links are config-driven and currently not set in env, so this section stays honest
                until the official Base token details are configured.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
