export interface BlogPostSummary {
  slug: string;
  dateLabel: string;
  isoDate: string;
  title: string;
  excerpt: string;
  tags: string[];
  track: 'Shipping' | 'Release' | 'Field Notes' | 'Build Log';
  href?: string;
}

export const blogPosts: BlogPostSummary[] = [
  {
    slug: 'open-letter-to-mimo',
    dateLabel: '16 Jun',
    isoDate: '2026-06-16',
    title: 'An Open Letter to the MiMo Team',
    excerpt: 'How MiMo powers Agentbot and what we recommend for the next chapter. Recommendations for function calling, streaming, multi-modal, and agent fine-tuning.',
    tags: ['MiMo', 'Open Letter', 'AI'],
    track: 'Field Notes',
  },
  {
    slug: 'react-19-migration',
    dateLabel: '16 Jun',
    isoDate: '2026-06-16',
    title: 'React 19 Migration — How We Did It in One Session',
    excerpt: 'Migrated Agentbot from React 18 to React 19. Only 6 TypeScript errors to fix. Zero deprecated APIs.',
    tags: ['React', 'Migration', 'Engineering'],
    track: 'Build Log',
  },
  {
    slug: 'json-render-generative-ui',
    dateLabel: '16 Jun',
    isoDate: '2026-06-16',
    title: 'JSON Render — Generative UI for Agentbot',
    excerpt: 'Integrated json-render for AI-generated interfaces. Describe a UI in plain English, get real React components.',
    tags: ['JSON Render', 'Generative UI', 'AI'],
    track: 'Release',
  },
  {
    slug: 'automations-mcp-integrations',
    dateLabel: '16 Jun',
    isoDate: '2026-06-16',
    title: 'Automations with MCP Integrations',
    excerpt: 'Event-driven workflows connecting to Slack, GitHub, Linear, Sentry, Datadog, and more.',
    tags: ['Automations', 'MCP', 'Integrations'],
    track: 'Release',
  },
  {
    slug: 'mimo-v25-pro-integration',
    dateLabel: '16 Jun',
    isoDate: '2026-06-16',
    title: 'MiMo-V2.5-Pro Integration — Full OpenClaw Support',
    excerpt:
      'Agentbot now fully supports MiMo-V2.5-Pro with OpenClaw framework, document processing (Word, Excel, PPT, PDF), and 3x reasoning efficiency. Legacy models deprecated June 30.',
    tags: ['MiMo', 'OpenClaw', 'Integration', 'Document Processing'],
    track: 'Release',
  },
  {
    slug: 'escrow-explained',
    dateLabel: '13 Jun',
    isoDate: '2026-06-13',
    title: 'USDC Escrow — Hold Funds Until the Work Is Approved',
    excerpt:
      'How Agentbot escrow lets two agents who have never met transact safely: the buyer holds USDC against a milestone, the hired agent submits the work, and funds release only on approval. Funded → submitted → released or refunded.',
    tags: ['Escrow', 'USDC', 'A2A', 'x402', 'Agents', 'Trust'],
    track: 'Field Notes',
  },
  {
    slug: 'agent-primitives',
    dateLabel: '13 Jun',
    isoDate: '2026-06-13',
    title: 'The Agentbot Agent Stack — Five Primitives Behind One Gateway',
    excerpt:
      'The five execution primitives behind Agentbot: model:auto inference, Fast Apply, Context Compaction, Code Search, Subagent Planner, and A2A — how agents discover, hire, and pay each other in USDC on Base.',
    tags: ['Gateway', 'API', 'Agents', 'A2A', 'Infrastructure', 'x402'],
    track: 'Field Notes',
  },
  {
    slug: 'ai-agent-frameworks-2026',
    dateLabel: '12 Jun',
    isoDate: '2026-06-12',
    title: 'AI Agent Frameworks in 2026 — An In-Depth Look at 8 SDKs',
    excerpt:
      'A comprehensive comparison of 8 AI agent frameworks in 2026: Claude Agent SDK, OpenAI Agents SDK, Google ADK, LangGraph, CrewAI, Smolagents, Pydantic AI, and Microsoft Agent Framework 1.0.',
    tags: ['AI Agents', 'Frameworks', 'LLM', 'Claude', 'OpenAI', 'Google'],
    track: 'Field Notes',
  },
  {
    slug: 'openclaw-2026-6-6',
    dateLabel: '12 Jun',
    isoDate: '2026-06-12',
    title: 'OpenClaw v2026.6.6 — Stability, Security & Performance',
    excerpt:
      'OpenClaw 2026.6.6 is now the default runtime on Agentbot. Stability fixes, security hardening, and performance improvements across the gateway.',
    tags: ['OpenClaw', 'Release', 'Security', 'Performance'],
    track: 'Release',
  },
  {
    slug: 'opengateway-explained',
    dateLabel: '12 Jun',
    isoDate: '2026-06-12',
    title: 'Opengateway Explained — One OpenAI-Compatible Endpoint for Every Model',
    excerpt:
      'What the Agentbot gateway is, why it exists, and how to ship with it in five minutes: one API key, one base URL swap, provider failover, and live usage tracking built in.',
    tags: ['Gateway', 'API', 'LLM', 'MiMo', 'Infrastructure'],
    track: 'Field Notes',
  },
  {
    slug: 'agentbot-api-collection-15-modules',
    dateLabel: '12 Jun',
    isoDate: '2026-06-12',
    title: 'Agentbot API Collection — Full Coverage Across 15 Modules',
    excerpt:
      'The Agentbot API collection has been fully built out and synced from the codebase, covering all major surface areas across 15 organized folders.',
    tags: ['API', 'Postman', 'Developer Tools', 'Integration'],
    track: 'Shipping',
  },
  {
    slug: 'claude-fable-openclaw-agentbot',
    dateLabel: '11 Jun',
    isoDate: '2026-06-11',
    title: 'Claude Fable 5 × OpenClaw Agentbot — Frontier Intelligence for Autonomous Agents',
    excerpt:
      "Claude Fable 5 is Anthropic's most capable model for days-long autonomous tasks. Here's how Agentbot users can access it via OpenRouter.",
    tags: ['Claude', 'Fable', 'OpenRouter', 'Models', 'AI'],
    track: 'Release',
  },
  {
    slug: 'agentbot-audit-improvements-june-2026',
    dateLabel: '10 Jun',
    isoDate: '2026-06-10',
    title: 'Security Audit & A+ Grade: How We Hardened Agentbot in One Day',
    excerpt:
      'We ran a comprehensive 4-phase security audit, fixed 20+ findings, eliminated all critical vulnerabilities, and achieved an A+ code quality grade — all in a single day.',
    tags: ['Security', 'Audit', 'Code Quality', 'Testing'],
    track: 'Shipping',
  },
  {
    slug: 'base-integration-sprint',
    dateLabel: '5 Jun',
    isoDate: '2026-06-05',
    title: 'Base Integration Sprint: Free AI, NFT Wristbands, Token Swaps',
    excerpt:
      'In 48 hours we shipped: free daily AI for Base wallet users, ERC-721 wristband NFTs, CDP Trade API swaps, radio widget, and full Base ecosystem integration. 52 files, 4,318 lines, 32 commits.',
    tags: ['Base', 'NFT', 'AI', 'Sprint'],
    track: 'Shipping',
  },
  {
    slug: 'openclaw-security-in-public',
    dateLabel: '1 May',
    isoDate: '2026-05-01',
    title: 'How OpenClaw Got Safer in Public',
    excerpt:
      'Open source is supposed to be the unsafe option. OpenClaw started on a Mac in Vienna as an experiment — now companies run it in production and help secure it. 1,309 security advisories later, here is what actually changed.',
    tags: ['OpenClaw', 'Security', 'Open Source'],
    track: 'Field Notes',
  },
  {
    slug: 'remote-access-for-agentbot-agents',
    dateLabel: '30 Apr',
    isoDate: '2026-04-30',
    title: 'Remote Access for Agentbot Agents',
    excerpt:
      'How to choose and set up SSH tunnels, Tailscale Serve, Funnel, or direct Tailnet access for your OpenClaw Gateway.',
    tags: ['OpenClaw', 'Remote Access', 'Tailscale', 'Guide'],
    track: 'Build Log',
  },
  {
    slug: 'london-oxford-bristol-linkup',
    dateLabel: '26 Apr',
    isoDate: '2026-04-26',
    title: 'London • Oxford • Bristol Link Up',
    excerpt:
      'The Bristol Collective links with London and Oxford nodes to deploy the next evolution of autonomous rave culture.',
    tags: ['Community', 'Bristol', 'Link Up'],
    track: 'Field Notes',
  },
  {
    slug: '25-days-since-launch',
    dateLabel: '25 Apr',
    isoDate: '2026-04-25',
    title: '25 Days Since Launch: The Zero-Human Evolution',
    excerpt:
      'First $560 earned, server bills paid, and the transition from SaaS tool to a self-operating cultural protocol.',
    tags: ['Revenue', 'Autonomy', 'Milestone', 'ZHC'],
    track: 'Build Log',
  },
  {
    slug: 'factory-ai-unification',
    dateLabel: '23 Apr',
    isoDate: '2026-04-23',
    title: 'The Factory AI Unification: Identity, Execution, and State',
    excerpt:
      'Platform update: 100% Railway migration, DID-native cryptographic signatures, durable workflow execution, and state mirroring to Gitlawb. The "Fact-Based Backend" is now live.',
    tags: ['Architecture', 'Identity', 'Security', 'Railway'],
    track: 'Build Log',
  },
  {
    slug: 'mimo-v2-pro-factory-master',
    dateLabel: '23 Apr',
    isoDate: '2026-04-23',
    title: 'MiMo V2 Pro: The New Factory Master Model',
    excerpt:
      'We are deploying Xiaomi MiMo V2 Pro as the default model for all new agents. High-performance logic via Vercel AI Gateway with unified rate limiting.',
    tags: ['AI', 'Models', 'MiMo', 'Vercel'],
    track: 'Shipping',
  },
  {
    slug: 'surviving-250-doc-backdoor',
    dateLabel: '21 Apr',
    isoDate: '2026-04-21',
    title: 'Surviving the 250-Document Backdoor',
    excerpt:
      'A joint Anthropic / UK AISI / Alan Turing study proved 250 poisoned documents can permanently backdoor any frontier LLM. Here is the practical playbook humans and agentic systems can deploy this quarter — model diversity, canary probes, signed RAG, sovereign fallback.',
    tags: ['Security', 'Data Poisoning', 'Provenance', 'Sovereign AI'],
    track: 'Field Notes',
  },
  {
    slug: 'open-source-catch-up-and-agentbot-coach',
    dateLabel: '17 Apr',
    isoDate: '2026-04-17',
    title: 'Open-Source Catch-Up, Cleaner Docs, and Agentbot Coach',
    excerpt:
      'A community update on safer public repos, refreshed SDK/docs surfaces, and the onboarding direction behind Agentbot Coach.',
    tags: ['Open Source', 'Docs', 'SDK', 'Onboarding'],
    track: 'Shipping',
  },
  {
    slug: 'openclaw-v2026-4-15-operator-mode',
    dateLabel: '17 Apr',
    isoDate: '2026-04-17',
    title: 'OpenClaw v2026.4.15 + Operator Mode',
    excerpt:
      'The biggest patch release yet with dreaming fixes, security hardening, and 60+ contributor patches. Plus Operator Mode — a guided onboarding layer for new users.',
    tags: ['OpenClaw', 'Operator Mode', 'Onboarding'],
    track: 'Release',
  },
  {
    slug: 'basefm-b2b-co-dj',
    dateLabel: '17 Apr',
    isoDate: '2026-04-17',
    title: 'baseFM × Agentbot: B2B Co-DJ Factory Network',
    excerpt:
      'The first streaming platform to let two DJs run a live B2B show from different locations. One Mux stream, a 120-second handoff window, WebRTC audio monitoring, and live chat.',
    tags: ['baseFM', 'B2B', 'Live Streaming', 'Shipping'],
    track: 'Shipping',
  },
  {
    slug: 'agent-to-agent-protocol',
    dateLabel: '13 Apr',
    isoDate: '2026-04-13',
    title: 'Agent-to-Agent Protocol: How Agentbot Agents Talk to Each Other',
    excerpt:
      'The A2A bus that lets agents negotiate, delegate, and settle USDC payments autonomously. SSRF-protected, cryptographically signed, MCP-compatible. First settlement at block 9,556,940.',
    tags: ['A2A', 'Protocol', 'Architecture', 'Autonomous Payments'],
    track: 'Build Log',
  },
  {
    slug: 'agentbot-open-source-community-token',
    dateLabel: '13 Apr',
    isoDate: '2026-04-13',
    title: 'AgentBot: Open-Source Infrastructure for the AI Agent Economy',
    excerpt:
      'What Agentbot is, why it exists, how the community token works, and a realistic view of trading on Pump.fun. The platform is the destination — not the token.',
    tags: ['Open Source', 'Community', 'Token', 'AI Agents'],
    track: 'Field Notes',
  },
  {
    slug: 'hardening-agentic-stack',
    dateLabel: '10 Apr',
    isoDate: '2026-04-10',
    title: 'The Hardening Agentic Stack',
    excerpt:
      'From chatbots to autonomous systems. MCP standardization, persistent memory, vision-based agents, and the infrastructure making agents production-ready.',
    tags: ['Industry', 'Infrastructure', 'Analysis', 'Security'],
    track: 'Field Notes',
  },
  {
    slug: 'mimo-v2-pro-powers-agentbot',
    dateLabel: '9 Apr',
    isoDate: '2026-04-09',
    title: 'MiMo-V2-Pro: The Model Powering Agentbot',
    excerpt:
      'Xiaomi MiMo Token Plan — 1.6B credits for $100/mo. The model behind Agentbot reasoning. Plus OpenRouter for 500+ models.',
    tags: ['Models', 'Guide', 'MiMo', 'OpenRouter'],
    track: 'Shipping',
  },
  {
    slug: 'security-patch-apr-9-2026',
    dateLabel: '9 Apr',
    isoDate: '2026-04-09',
    title: 'Security Patch: Zero Vulnerabilities',
    excerpt:
      'We patched three dependency CVEs (hono, @hono/node-server, defu) and brought the platform to zero known vulnerabilities across both web and backend.',
    tags: ['Security', 'Patch', 'Vulnerabilities', 'Audit'],
    track: 'Build Log',
  },
  {
    slug: '9-hours-25-commits',
    dateLabel: '9 Apr',
    isoDate: '2026-04-09',
    title: '9 Hours, 25 Commits, 7 Services',
    excerpt:
      'A full day of shipping: browser automation, sandbox, Liquid node, custom domains, workflow SDK, and more.',
    tags: ['Shipping', 'Infrastructure', 'Update'],
    track: 'Shipping',
  },
  {
    slug: 'agentic-infrastructure-shift',
    dateLabel: '9 Apr',
    isoDate: '2026-04-09',
    title: 'The Agentic Infrastructure Shift',
    excerpt:
      "30% of Vercel deployments are now by coding agents. Vercel declares agentic infrastructure. Here's what it means for Agentbot.",
    tags: ['Industry', 'AI Agents', 'Infrastructure', 'Vercel'],
    track: 'Field Notes',
  },
  {
    slug: 'basefm-open-source',
    dateLabel: '9 Apr',
    isoDate: '2026-04-09',
    title: 'baseFM Goes Open Source',
    excerpt:
      'Onchain radio for the Base ecosystem is now open source. Live DJs, crypto tipping, token-gated community, and onchain events — all on GitHub.',
    tags: ['Open Source', 'Base', 'Community', 'baseFM'],
    track: 'Shipping',
  },
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
    slug: 'mimo-v2-pro-production-case-study',
    dateLabel: '9 Apr',
    isoDate: '2026-04-09',
    title: 'How MiMo-V2-Pro Powers Every Agent on Agentbot — A Production Case Study',
    excerpt:
      "Every agent deployed on Agentbot boots with Xiaomi MiMo-V2-Pro. Here's why we chose it over GPT-5.2 and Claude, and what we've learned running it 24/7.",
    tags: ['MiMo-V2-Pro', 'Xiaomi', 'Case Study', 'Production'],
    track: 'Field Notes',
  },
  {
    slug: 'cyber-agents-2026',
    dateLabel: '8 Apr',
    isoDate: '2026-04-08',
    title: 'Cybersecurity in the Age of AI',
    excerpt:
      'How frontier AI models like Claude Mythos Preview are transforming vulnerability discovery — and what it means for the future of cybersecurity.',
    tags: ['Security', 'AI', 'Cybersecurity'],
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
    slug: 'openclaw-v2026-4-7',
    dateLabel: '7 Apr',
    isoDate: '2026-04-07',
    title: 'OpenClaw v2026.4.7',
    excerpt:
      'Performance improvements and bug fixes across the core runtime. Agentbot now runs the latest OpenClaw.',
    tags: ['OpenClaw', 'Release'],
    track: 'Release',
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
      "We followed all 102 OpenClaw contributors. Here's why this matters for the AI agent ecosystem.",
    tags: ['Community', 'OpenClaw'],
    track: 'Shipping',
  },
  {
    slug: 'btcpay-agentbot',
    dateLabel: '3 Apr',
    isoDate: '2026-04-03',
    title: 'BTCPay Agentbot: Bitcoin-Native Agent Payments',
    excerpt:
      'No custodial middleman. No API keys from a third party. Your agents, your keys, your node.',
    tags: ['Bitcoin', 'BTCPay', 'Agents', 'Payments'],
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
    slug: 'launch-day-hardening-2026-03-30',
    dateLabel: '30 Mar',
    isoDate: '2026-03-30',
    title: 'Launch Day: Security Sweep, Error Boundaries & Performance',
    excerpt:
      'Six security patches, a full React error boundary layer, and performance optimizations that cut session fetches by 99.8%.',
    tags: ['Performance', 'Security', 'Launch'],
    track: 'Build Log',
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
    slug: 'openclaw-march-2026-roundup',
    dateLabel: '30 Mar',
    isoDate: '2026-03-30',
    title: 'OpenClaw in March: Tool Gates, Grok Search, Image Gen, and Why It Matters',
    excerpt:
      "March was a big month for OpenClaw. Three releases shipped (3.23, 3.24, 3.28), each adding real capabilities. Here's what matters for Agentbot users.",
    tags: ['OpenClaw', 'March 2026'],
    track: 'Field Notes',
  },
  {
    slug: 'agentbot-launch',
    dateLabel: '31 Mar',
    isoDate: '2026-03-31',
    title: 'Agentbot Launches March 31',
    excerpt: 'Your AI agent. Your hardware. Your rules. Self-hosted, BYOK, and one-command deploy.',
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
    slug: 'countdown-d6',
    dateLabel: '25 Mar',
    isoDate: '2026-03-25',
    title: 'T-6 Days: Agentbot Launches March 31',
    excerpt: '6 days until Agentbot. The countdown to launch is on.',
    tags: ['Countdown', 'Launch'],
    track: 'Shipping',
  },
  {
    slug: 'platform-ops-2026-03-25',
    dateLabel: '25 Mar',
    isoDate: '2026-03-25',
    title: 'Platform Ops: Dashboard Overhaul & Infrastructure Hardening',
    excerpt:
      "Late-night platform session. Here's what shipped, what we fixed, and where we're headed.",
    tags: ['Update', 'Infrastructure'],
    track: 'Shipping',
  },
  {
    slug: 'openclaw-2026-3-23',
    dateLabel: '24 Mar',
    isoDate: '2026-03-24',
    title: 'OpenClaw v2026.3.23 — Stability & Auth Fixes',
    excerpt:
      'Major stability release with 30+ fixes for browser attach, ClawHub auth, gateway reliability, and security hardening.',
    tags: ['Stability', 'Security'],
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
    slug: 'agentbot-mimo-native',
    dateLabel: '2 Jun',
    isoDate: '2026-06-02',
    title: 'How Agentbot Built the First MiMo-Native Agent Platform',
    excerpt:
      '99% cost reduction. Direct MiMo V2.5 integration. BYOK support. The technical deep-dive.',
    tags: ['MiMo', 'Integration', 'Technical'],
    track: 'Shipping',
  },
  {
    slug: 'base-integration-ships',
    dateLabel: '5 Jun',
    isoDate: '2026-06-05',
    title: 'Agentbot Goes Onchain: Builder Codes, NFT Wristbands, and Token Swaps',
    excerpt:
      'Builder Codes for onchain attribution. NFT wristbands for community access. Token swaps via CDP. Everything we built in one night on Base.',
    tags: ['Base', 'Builder Codes', 'NFT', 'CDP', 'Token Swaps'],
    track: 'Shipping',
  },
  {
    slug: 'agentbot-sdk-mcp-x402',
    dateLabel: '3 Jun',
    isoDate: '2026-06-03',
    title: 'SDK. MCP Server. x402 Payments. Full Stack.',
    excerpt:
      '@agentbot/sdk, standalone MCP server, real tool execution, and x402 micropayments. The complete AI agent infrastructure.',
    tags: ['SDK', 'MCP', 'x402', 'Infrastructure'],
    track: 'Shipping',
  },
  {
    slug: 'atlas-basefm',
    dateLabel: '19 Mar',
    isoDate: '2026-03-19',
    title: 'Atlas_baseFM: The Zero-Human Signal on Base',
    excerpt:
      'From BTCPayJungle (2017) to baseFM (2026) — 9 years of building non-custodial infrastructure. This is the autonomous engineering standard now operating on Base.',
    tags: ['baseFM', 'Atlas', 'Zero Human'],
    track: 'Field Notes',
  },
  {
    slug: 'botid-protection',
    dateLabel: '19 Mar',
    isoDate: '2026-03-19',
    title: 'BotID: Invisible Protection for AI Agents',
    excerpt:
      "We've added Vercel BotID to protect our platform from automated attacks. Here's why it matters for AI agents.",
    tags: ['Security', 'Bot Protection', 'Vercel'],
    track: 'Shipping',
  },
  {
    slug: 'coinbase-agent-wallets',
    dateLabel: '19 Mar',
    isoDate: '2026-03-19',
    title: 'Coinbase Agentic Wallets',
    excerpt:
      'Traditional wallets require human approval for every transaction. Agentic wallets are controlled by AI agents that can transact autonomously.',
    tags: ['Coinbase', 'Wallets', 'CDP'],
    track: 'Shipping',
  },
  {
    slug: 'minimax-m2-7',
    dateLabel: '19 Mar',
    isoDate: '2026-03-19',
    title: 'MiniMax M2.7 Now Available on Agentbot',
    excerpt:
      'M2.7 is a next-generation large language model designed for autonomous, real-world productivity. Available on OpenRouter.',
    tags: ['AI', 'OpenRouter', 'Agents'],
    track: 'Shipping',
  },
  {
    slug: 'opensource-release',
    dateLabel: '19 Mar',
    isoDate: '2026-03-19',
    title: 'Agentbot is Now Open Source',
    excerpt:
      "Today we're making a major leap. Agentbot is now open source under the MIT license. The entire codebase — all 362 files, every feature, every integration — is available for the community.",
    tags: ['Open Source', 'Community', 'Build'],
    track: 'Shipping',
  },
  {
    slug: 'security-hardening-2026',
    dateLabel: '7 Mar',
    isoDate: '2026-03-07',
    title: 'Security Hardening & Enterprise APIs — March 2026',
    excerpt:
      "We're shipping massive security upgrades and 9 new enterprise APIs. Agentbot is now hardened against DDoS, SQL injection, XSS, bot attacks, and more.",
    tags: ['Security', 'Enterprise', 'APIs'],
    track: 'Build Log',
  },
  {
    slug: 'sponsor-us',
    dateLabel: '19 Mar',
    isoDate: '2026-03-19',
    title: 'Sponsor Agentbot & Build the Future of Agentic AI',
    excerpt:
      "We're inviting the community to sponsor Agentbot's development. Your support directly funds the future of autonomous AI agents.",
    tags: ['Sponsors', 'Partnership', 'Agentic AI'],
    track: 'Field Notes',
  },
  {
    slug: 'tempo-wallet',
    dateLabel: '19 Mar',
    isoDate: '2026-03-19',
    title: 'Tempo Wallet: Autonomous Agent Payments',
    excerpt:
      'Tempo is a wallet infrastructure designed specifically for AI agents. Unlike traditional wallets that require human signatures, Tempo wallets let agents transact autonomously.',
    tags: ['MPP', 'Tempo', 'Agents'],
    track: 'Shipping',
  },
  {
    slug: 'royaltybot-launch',
    dateLabel: '18 Mar',
    isoDate: '2026-03-18',
    title: 'Introducing RoyaltyBot: Instant Payment Layer for Music',
    excerpt:
      "Here's how royalty payments work today: DSPs calculate your streaming revenue, send to distributor, and 60-90 days later it hits your bank. RoyaltyBot changes that.",
    tags: ['Music', 'RoyaltyBot', 'Payments'],
    track: 'Shipping',
  },
  {
    slug: 'openclaw-2026-3-13-release',
    dateLabel: '16 Mar',
    isoDate: '2026-03-16',
    title: 'OpenClaw 2026.3.13 Released + Agentbot Progress Update',
    excerpt:
      'OpenClaw 2026.3.13 is now the production runtime across all Agentbot deployments. Ollama support, A2A protocol, streaming infrastructure, and smart AI tiers.',
    tags: ['Release', 'OpenClaw', 'Agentbot'],
    track: 'Release',
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
  {
    slug: 'bankr-wallet-guide',
    dateLabel: '14 Mar',
    isoDate: '2026-03-14',
    title: 'Guide: Connect Your Bankr Wallet to Agentbot',
    excerpt:
      "Just like you bring your own OpenRouter API key for AI, you can now bring your own Bankr wallet for your agents to trade with. Here's how to set it up.",
    tags: ['Guide', 'Tutorial', 'Wallet'],
    track: 'Build Log',
  },
  {
    slug: 'platform-v2-launch',
    dateLabel: '14 Mar',
    isoDate: '2026-03-14',
    title: 'Platform v2 Launch: Trading, Monetization & Zero-Human Ops',
    excerpt:
      'The Agentbot platform is now fully production-ready with autonomous trading, x402 payment protocol support, and a completely redesigned finance dashboard.',
    tags: ['Launch', 'Trading', 'x402'],
    track: 'Shipping',
  },
  {
    slug: 'kimi-drop',
    dateLabel: '24 Feb',
    isoDate: '2026-02-24',
    title: 'The Kimi Drop: How We Built Feature Parity in 18 Hours',
    excerpt:
      "We analyzed Kimi Claw — a competitor with impressive features. Today, we're shipping everything they have, plus more. Here's how we did it.",
    tags: ['Competition', 'Shipping', 'Features'],
    track: 'Build Log',
  },
  {
    slug: 'major-update-2026',
    dateLabel: '24 Feb',
    isoDate: '2026-02-24',
    title: 'Major Update: Agentbot Now Matches Kimi Claw',
    excerpt:
      "The biggest update in Agentbot's history. After analyzing Kimi Claw's feature set, we've implemented everything they offer while keeping our core advantages.",
    tags: ['Update', 'Features', 'Competition'],
    track: 'Shipping',
  },
  {
    slug: 'powerful-builders-in-the-cloud',
    dateLabel: '7 Mar',
    isoDate: '2026-03-07',
    title: 'Powerful Builders, In The Cloud',
    excerpt:
      "We're building for the builders. For those who refuse to be constrained by infrastructure limits. For teams that want to ship fast, think big, and scale without friction.",
    tags: ['Vision', 'Platform', 'Infrastructure'],
    track: 'Field Notes',
  },
  {
    slug: 'welcome-openclaw-users',
    dateLabel: '7 Mar',
    isoDate: '2026-03-07',
    title: 'Welcome OpenClaw Users — Agentic Meetups Coming Soon',
    excerpt:
      "We're excited to welcome the entire OpenClaw community to Agentbot. This is your place to build, deploy, and scale AI agents.",
    tags: ['Announcement', 'Community'],
    track: 'Field Notes',
  },
  {
    slug: 'daily-2026-03-05',
    dateLabel: '5 Mar',
    isoDate: '2026-03-05',
    title: 'baseFM March Update: Agent Skills, Autonomous Trading & More',
    excerpt:
      "A massive leap forward for the baseFM ecosystem and the Agentbot platform. Here's the breakdown of everything that just dropped.",
    tags: ['Update', 'Skills', 'Trading'],
    track: 'Shipping',
  },
  {
    slug: 'daily-2026-03-04',
    dateLabel: '4 Mar',
    isoDate: '2026-03-04',
    title: 'Enhancing User Experience with OpenClaw: Live Activity Connection Status',
    excerpt:
      'Significant improvements to the OpenClaw framework that elevate the performance and user experience for AI agents on Agentbot.',
    tags: ['OpenClaw', 'Agentbot'],
    track: 'Field Notes',
  },
  {
    slug: 'daily-2026-03-03',
    dateLabel: '3 Mar',
    isoDate: '2026-03-03',
    title: 'Enhancements in OpenClaw: Elevating Your Agentbot Experience',
    excerpt:
      'The Agentbot platform continues to evolve with the best tools for deploying and managing AI agents effectively.',
    tags: ['OpenClaw', 'Agentbot'],
    track: 'Field Notes',
  },
  {
    slug: 'v2026-3-2',
    dateLabel: '3 Mar',
    isoDate: '2026-03-03',
    title: 'OpenClaw v2026.3.2 + Agentbot Platform Update',
    excerpt:
      'OpenClaw v2026.3.2 is out today with key improvements across the runtime and platform.',
    tags: ['OpenClaw', 'Release'],
    track: 'Release',
  },
  {
    slug: 'daily-2026-03-02',
    dateLabel: '2 Mar',
    isoDate: '2026-03-02',
    title: 'Agentbot Upgraded to OpenClaw v2026.3.1',
    excerpt:
      'This release includes numerous enhancements to the platform runtime and agent capabilities.',
    tags: ['Update', 'OpenClaw'],
    track: 'Shipping',
  },
  {
    slug: 'daily-2026-03-01',
    dateLabel: '1 Mar',
    isoDate: '2026-03-01',
    title: 'Exciting OpenClaw Updates: Improved Performance and Enhanced Usability',
    excerpt:
      'Updates that boost the performance and usability of the Agentbot AI deployment platform.',
    tags: ['OpenClaw', 'Platform Improvements'],
    track: 'Field Notes',
  },
  {
    slug: 'daily-2026-02-28',
    dateLabel: '28 Feb',
    isoDate: '2026-02-28',
    title: 'Unlocking New Features in Agentbot: Enhancements from OpenClaw',
    excerpt:
      'Several improvements in the OpenClaw framework that enhance your experience with Agentbot.',
    tags: ['OpenClaw', 'Agentbot'],
    track: 'Field Notes',
  },
  {
    slug: 'daily-2026-02-27',
    dateLabel: '27 Feb',
    isoDate: '2026-02-27',
    title: 'Enhancing Agentbot with OpenClaw: New Features and Improvements',
    excerpt:
      'Significant updates in the OpenClaw framework that enhance your experience with the Agentbot platform.',
    tags: ['OpenClaw', 'Agentbot'],
    track: 'Field Notes',
  },
  {
    slug: 'daily-2026-02-26',
    dateLabel: '26 Feb',
    isoDate: '2026-02-26',
    title: 'Enhancing Agentbot with OpenClaw Updates: February 2026',
    excerpt: 'OpenClaw 2026.2.26 introduces several impactful changes for the Agentbot platform.',
    tags: ['OpenClaw', 'Platform Updates'],
    track: 'Field Notes',
  },
  {
    slug: 'daily-2026-02-25',
    dateLabel: '25 Feb',
    isoDate: '2026-02-25',
    title: 'Embracing New Heights: OpenClaw Framework Updates and Features',
    excerpt:
      'Key updates designed to enhance the performance and usability of the Agentbot platform.',
    tags: ['OpenClaw', 'AI Deployment'],
    track: 'Field Notes',
  },
  {
    slug: 'daily-2026-02-24',
    dateLabel: '24 Feb',
    isoDate: '2026-02-24',
    title: 'Automated Blog System Now Live',
    excerpt:
      "We've just launched our automated blog system that publishes fresh content daily at 9am UK time.",
    tags: ['Platform', 'Automation'],
    track: 'Shipping',
  },
  {
    slug: 'underground-agents-drop',
    dateLabel: '24 Feb',
    isoDate: '2026-02-24',
    title: 'Factory Agents Drop: Built by Ravers, for Ravers',
    excerpt:
      'New agent templates for autonomous collectives, crypto wallet integration, and major UI improvements. Built for the culture.',
    tags: ['Release', 'Factory'],
    track: 'Shipping',
  },
  {
    slug: 'credit-pricing',
    dateLabel: 'Feb 2026',
    isoDate: '2026-02-15',
    title: 'Introducing Credit-Based Pricing',
    excerpt: 'Pay only for what you use with our new flexible credit system.',
    tags: ['Feature', 'Pricing'],
    track: 'Shipping',
  },
  {
    slug: 'first-agent',
    dateLabel: 'Feb 2026',
    isoDate: '2026-02-15',
    title: 'How to Deploy Your First AI Agent in 60 Seconds',
    excerpt: 'Launch your OpenClaw agent with Telegram integration. No server setup required.',
    tags: ['Tutorial', 'Getting Started'],
    track: 'Build Log',
  },
  {
    slug: 'platform-v2',
    dateLabel: 'Feb 2026',
    isoDate: '2026-02-15',
    title: 'Platform V2: Faster Deployments & New AI Models',
    excerpt:
      "We've shipped major performance improvements and expanded AI model support. Here's what's new.",
    tags: ['Release', 'Performance'],
    track: 'Shipping',
  },
  {
    slug: 'weekly-improvements',
    dateLabel: 'Feb 2026',
    isoDate: '2026-02-15',
    title: 'Weekly Improvements: What is Shipping',
    excerpt:
      "This week's improvements: dark mode UI, Stripe checkout, OAuth, and email integration.",
    tags: ['Update', 'Weekly'],
    track: 'Shipping',
  },
  {
    slug: 'best-practices',
    dateLabel: 'Jan 2026',
    isoDate: '2026-01-15',
    title: 'Best Practices for Production AI Agents',
    excerpt:
      'Security tips, monitoring strategies, and automation patterns for running agents at scale.',
    tags: ['Best Practices', 'Security'],
    track: 'Field Notes',
  },
  {
    slug: 'resource-management',
    dateLabel: 'Jan 2026',
    isoDate: '2026-01-15',
    title: 'Managing AI Agent Resources: Memory, CPU, and Scaling',
    excerpt:
      'Understanding resource allocation and when to upgrade your plan for production workloads.',
    tags: ['Technical', 'Scaling'],
    track: 'Build Log',
  },
  {
    slug: 'webhooks',
    dateLabel: 'Jan 2026',
    isoDate: '2026-01-15',
    title: 'API Webhooks and External Integrations',
    excerpt:
      'Connect your AI agent to external systems using webhooks, APIs, and custom workflows.',
    tags: ['Tutorial', 'Integrations'],
    track: 'Build Log',
  },
  {
    slug: 'welcome',
    dateLabel: 'Jan 2026',
    isoDate: '2026-01-15',
    title: 'Welcome to Agentbot',
    excerpt:
      'We built this platform to remove server setup friction and help builders launch AI agents in under a minute.',
    tags: ['Announcement'],
    track: 'Field Notes',
  },
];
