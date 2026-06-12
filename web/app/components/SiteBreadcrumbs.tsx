'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Site-wide auto-derived breadcrumb trail with schema.org JSON-LD.
// Hidden on the homepage, auth pages, full-bleed app surfaces, and the
// dashboard (which renders its own Breadcrumbs component).
const HIDDEN_PATHS = new Set(['/', '/login', '/signup', '/forgot-password', '/billing'])
const HIDDEN_PREFIXES = ['/chat', '/playground', '/coding-agent', '/dashboard', '/admin', '/api']

const SEGMENT_LABELS: Record<string, string> = {
  'vercel-gateway': 'Gateway',
  'coding-agent': 'Coding Agent',
  openclaw: 'OpenClaw',
  basefm: 'BASEFM',
  'use-cases': 'Use Cases',
  faq: 'FAQ',
  openrouter: 'OpenRouter',
  mimo: 'MiMo',
  'agent-team': 'Agent Team',
  'creator-toolkit': 'Creator Toolkit',
  'generate-music': 'Generate Music',
  'generate-video': 'Generate Video',
  'music-wizard': 'Music Wizard',
  'open-agents': 'Open Agents',
  'open-learning': 'Open Learning',
  'expert-setup': 'Expert Setup',
  ai: 'AI',
  api: 'API',
  nft: 'NFT',
  tts: 'TTS',
  usdc: 'USDC',
}

/** Opaque ids (uuids, hashes, long slugless strings) get truncated */
function looksLikeId(segment: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(segment) ||
    (segment.length > 24 && !segment.includes('-'))
  )
}

function labelFor(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  if (looksLikeId(segment)) return `${segment.slice(0, 8)}…`
  return segment
    .split('-')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}

export default function SiteBreadcrumbs() {
  const pathname = usePathname()

  if (!pathname || HIDDEN_PATHS.has(pathname)) return null
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null

  const allCrumbs = segments.map((segment, i) => ({
    label: labelFor(decodeURIComponent(segment)),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }))

  // Collapse deep trails: keep first crumb, ellipsis, last two.
  // JSON-LD below always uses the full trail.
  const crumbs =
    allCrumbs.length > 4
      ? [allCrumbs[0], { label: '…', href: '' }, ...allCrumbs.slice(-2)]
      : allCrumbs

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://agentbot.sh/' },
      ...allCrumbs.map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: crumb.label,
        item: `https://agentbot.sh${crumb.href}`,
      })),
    ],
  }

  return (
    // body has pt-12 (48px); mt-2 clears the remaining 8px of the fixed h-14 navbar
    <nav aria-label="Breadcrumb" className="mt-2 border-b border-zinc-900/80 bg-black font-mono">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ol className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto whitespace-nowrap px-5 py-2 text-[10px] uppercase tracking-widest sm:px-6">
        <li>
          <Link href="/" className="text-zinc-600 transition-colors hover:text-white">Home</Link>
        </li>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <li key={crumb.href || `ellipsis-${i}`} className="flex items-center gap-1.5">
              <span aria-hidden className="text-zinc-800">/</span>
              {isLast ? (
                <span aria-current="page" className="text-orange-500">{crumb.label}</span>
              ) : crumb.href ? (
                <Link href={crumb.href} className="text-zinc-600 transition-colors hover:text-white">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-hidden className="text-zinc-600">{crumb.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
