export interface BlogPostSummary {
  slug: string
  dateLabel: string
  isoDate: string
  title: string
  excerpt: string
  tags: string[]
  track: 'Shipping' | 'Release' | 'Field Notes' | 'Build Log'
  href?: string
}

export const blogPosts: BlogPostSummary[] = [
  {
    slug: 'building-saas-with-factory-droid',
    dateLabel: '9 Apr',
    isoDate: '2026-04-09',
    title: 'Building a SaaS Platform with Factory Droid',
    excerpt:
      'How one developer ships an AI agent platform at startup speed using custom droids as a virtual engineering team.',
    tags: ['Factory Droid', 'SaaS', 'Build in Public', 'Developer Tools'],
    track: 'Build Log',
  },
  {
    slug: 'mimo-v2-pro-powers-agentbot',
    dateLabel: '9 Apr',
    isoDate: '2026-04-09',
    title: 'How MiMo-V2-Pro Powers Every Agent on Agentbot — A Production Case Study',
    excerpt:
      'Every agent deployed on Agentbot boots with Xiaomi MiMo-V2-Pro. Here\'s why we chose it over GPT-5.2 and Claude, and what we\'ve learned running it 24/7.',
    tags: ['MiMo-V2-Pro', 'Xiaomi', 'Case Study', 'Production'],
    track: 'Field Notes',
  },
  {
    slug: 'openclaw-v2026-4-9',
    dateLabel: '9 Apr',
    isoDate: '2026-04-09',
    title: 'OpenClaw v2026.4.9 — Dreaming, SSRF Hardening, Character QA & Android Pairing',
    excerpt:
      'REM dream backfill with diary timeline UI, SSRF and node exec injection hardening, character-vibes QA evals, and a complete Android pairing overhaul.',
    tags: ['OpenClaw', 'Dreaming', 'Security', 'Android'],
    track: 'Release',
  },
  {
    slug: 'platform-recovery-and-hardening-apr-9-2026',
    dateLabel: '9 Apr',
    isoDate: '2026-04-09',
    title: 'Platform Recovery, Mainnet Bitcoin, and Production Guardrails',
    excerpt:
      'We spent the last stretch repairing the Railway stack, moving Bitcoin to mainnet, hardening the wallet/runtime path, and putting better production protection around Agentbot.',
    tags: ['Operations', 'Railway', 'Bitcoin', 'Hardening'],
    track: 'Build Log',
  },
  {
    slug: 'conference-recap-tokyo-london-2026',
    dateLabel: '9 Apr',
    isoDate: '2026-04-09',
    title: 'Conference Recap: Tokyo & London 2026 — AI Agents Are the New Consensus',
    excerpt:
      'TEAMZ Summit Tokyo, Consensus Hong Kong, and London Blockchain Conference all converge on one thesis: autonomous AI agents running on crypto rails are the next layer of infrastructure.',
    tags: ['Conferences', 'AI Agents', 'Tokyo', 'London', '$AGENTBOT'],
    track: 'Field Notes',
  },
  {
    slug: 'agentbot-update-apr-9-2026',
    dateLabel: '9 Apr',
    isoDate: '2026-04-09',
    title: 'Solana Integration, Blockchain Buddies & Liquid Wallet Kit',
    excerpt:
      'New: Solana Agent Kit, Blockchain Buddies digital pets, Liquid Wallet Kit docs, and full competitive analysis vs solana-clawd.',
    tags: ['Solana', 'Buddies', 'Liquid', 'LWK'],
    track: 'Shipping',
  },
  {
    slug: 'agentbot-update-apr-8-2026',
    dateLabel: '8 Apr',
    isoDate: '2026-04-08',
    title: 'Community Token, Turborepo 2.9, and More',
    excerpt:
      'Big update: AGENTBOT launched on Solana pump.fun, Turborepo 2.9, OpenClaw latest, Blockstream Jade, and live GitHub stars.',
    tags: ['Token', 'Solana', 'Turborepo', 'OpenClaw'],
    track: 'Shipping',
  },
  {
    slug: 'agentbot-on-ipfs-via-gitlawb',
    dateLabel: '7 Apr',
    isoDate: '2026-04-07',
    title: 'Our Code is Now on IPFS',
    excerpt:
      'We mirrored our open source repo to gitlawb — now it lives on IPFS, decentralized, with DID identity for agents.',
    tags: ['IPFS', 'gitlawb', 'Decentralized'],
    track: 'Shipping',
  },
  {
    slug: 'gitlawb-decentralized-git-for-agents',
    dateLabel: '7 Apr',
    isoDate: '2026-04-07',
    title: 'Decentralized Git for AI Agents',
    excerpt:
      'Exploring gitlawb — a decentralized git network where AI agents have DID identities, own repos, and collaborate via MCP.',
    tags: ['Exploration', 'gitlawb', 'Decentralized'],
    track: 'Field Notes',
  },
  {
    slug: 'ai-agent-jobs-board-live',
    dateLabel: '7 Apr',
    isoDate: '2026-04-07',
    title: 'AI Agent Jobs Board is Live',
    excerpt:
      'A jobs board dedicated to AI agent developers and builders. Post jobs, find talent, build the future.',
    tags: ['Feature', 'Jobs', 'Beta'],
    track: 'Shipping',
  },
  {
    slug: 'open-source-multi-tenant-architecture',
    dateLabel: '7 Apr',
    isoDate: '2026-04-07',
    title: 'Open Source Multi-Tenant AI Agent Platform',
    excerpt:
      'How we built Agentbot with Docker isolation, BYOK AI, USDC payments on Base, and a skill marketplace.',
    tags: ['Architecture', 'Open Source', 'Engineering'],
    track: 'Build Log',
  },
  {
    slug: 'openclaw-v2026-4-5',
    dateLabel: '7 Apr',
    isoDate: '2026-04-07',
    title: 'OpenClaw v2026.4.5',
    excerpt:
      'Video generation, music generation, new providers (Qwen, Fireworks, Bedrock Mantle), multilingual Control UI, and more.',
    tags: ['OpenClaw', 'Release'],
    track: 'Release',
  },
  {
    slug: 'following-openclaw-contributors',
    dateLabel: '7 Apr',
    isoDate: '2026-04-07',
    title: 'Following the OpenClaw Contributors',
    excerpt:
      'We followed all 102 OpenClaw contributors. Here\'s why this matters for the AI agent ecosystem.',
    tags: ['Community', 'OpenClaw'],
    track: 'Shipping',
  },
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
