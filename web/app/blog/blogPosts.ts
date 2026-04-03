export interface BlogPostSummary {
  slug: string
  dateLabel: string
  isoDate: string
  title: string
  excerpt: string
  tags: string[]
  track: 'Shipping' | 'Release' | 'Field Notes' | 'Build Log'
}

export const blogPosts: BlogPostSummary[] = [
  {
    slug: 'btcpay-agentbot',
    dateLabel: '3 Apr',
    isoDate: '2026-04-03',
    title: 'BTCPay Agentbot: Bitcoin-Native Agent Payments',
    excerpt:
      'Headless Bitcoin infrastructure for AI agents. Non-custodial wallets, A2A BTC payments, Fast Sync, and 10GB pruned nodes.',
    tags: ['Bitcoin', 'Payments'],
    track: 'Shipping',
  },
  {
    slug: 'how-we-built-multi-tenant-agent-platform',
    dateLabel: '2 Apr',
    isoDate: '2026-04-02',
    title: 'How We Built a Multi-Tenant AI Agent Platform',
    excerpt:
      'BYOK infrastructure, OpenClaw gateway, eight channels, Docker agent containers, and the open-source architecture behind Agentbot.',
    tags: ['Open Source', 'Architecture'],
    track: 'Build Log',
  },
  {
    slug: 'agentbot-showcase-trials-live',
    dateLabel: '2 Apr',
    isoDate: '2026-04-02',
    title: 'Trials Live, Showcase Open',
    excerpt:
      '7-day free trials, public agent showcase, Stripe payments, and a launch built in London on a Mac mini.',
    tags: ['Launch', 'Showcase'],
    track: 'Shipping',
  },
  {
    slug: 'platform-update-april-2026',
    dateLabel: '2 Apr',
    isoDate: '2026-04-02',
    title: 'April Update - Orchestration Engine and v1.0.0',
    excerpt:
      'Concurrent tool orchestration, tiered permission gates, encrypted per-user keys, and the v1.0.0 open-source release.',
    tags: ['Release', 'Platform'],
    track: 'Release',
  },
  {
    slug: 'pre-launch-hardening-2026-03-30',
    dateLabel: '30 Mar',
    isoDate: '2026-03-30',
    title: 'Pre-Launch Hardening: Payment Audit',
    excerpt:
      'Five critical payment gaps found and fixed before launch. Every endpoint locked down before D-1.',
    tags: ['Security', 'Payments'],
    track: 'Field Notes',
  },
  {
    slug: 'agentbot-launch',
    dateLabel: '31 Mar',
    isoDate: '2026-03-31',
    title: 'Agentbot Launches March 31',
    excerpt:
      'Your AI agent. Your hardware. Your rules. Self-hosted, BYOK, and one-command deploy.',
    tags: ['Launch'],
    track: 'Shipping',
  },
  {
    slug: 'openclaw-v2026-3-28',
    dateLabel: '28 Mar',
    isoDate: '2026-03-28',
    title: 'OpenClaw v2026.3.28',
    excerpt:
      'A release focused on gateway stability, compatibility, and production operator quality-of-life fixes.',
    tags: ['OpenClaw', 'Release'],
    track: 'Release',
  },
  {
    slug: 'openclaw-v2026-3-24',
    dateLabel: '26 Mar',
    isoDate: '2026-03-26',
    title: 'OpenClaw v2026.3.24',
    excerpt:
      'Gateway OpenAI compatibility, security fixes, CLI container support, and better channel isolation.',
    tags: ['OpenClaw', 'Release'],
    track: 'Release',
  },
  {
    slug: 'mimo-v2-pro',
    dateLabel: '23 Mar',
    isoDate: '2026-03-23',
    title: "MiMo-V2-Pro: Xiaomi's Flagship AI Model",
    excerpt:
      '1T+ parameters, 1M context, strong programming benchmarks, and now the default model on Agentbot.',
    tags: ['Models'],
    track: 'Shipping',
  },
  {
    slug: 'launch-week-2026-3-21',
    dateLabel: '21 Mar',
    isoDate: '2026-03-21',
    title: '313 Commits in One Week',
    excerpt:
      'Security hardening, RLS, real agent provisioning, BullMQ workers, and the design system locked for launch.',
    tags: ['Build Log', 'Launch'],
    track: 'Build Log',
  },
  {
    slug: 'zero-human-company',
    dateLabel: '14 Mar',
    isoDate: '2026-03-14',
    title: 'Running a Zero-Human Company',
    excerpt:
      'How Atlas operates autonomously across deployments, support, trading, and content creation.',
    tags: ['AI', 'Operations'],
    track: 'Field Notes',
  },
  {
    slug: 'battle-tested',
    dateLabel: '14 Mar',
    isoDate: '2026-03-14',
    title: 'Battle Tested: Live in the Field',
    excerpt:
      'Real problems, real operators, and the constraints that shaped the product in production.',
    tags: ['Philosophy', 'Operations'],
    track: 'Field Notes',
  },
]
