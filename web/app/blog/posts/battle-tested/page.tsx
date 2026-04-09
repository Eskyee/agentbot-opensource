import Link from 'next/link';

export const metadata = {
  title: 'Battle Tested: Living in the Field | Agentbot',
  description: 'How we built Agentbot from the trenches - real problems, real solutions, zero marketing fluff.',
};

export default function BattleTestedPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-green-400 tracking-widest">LIVE FROM THE FIELD</span>
            <span className="text-xs text-zinc-500">Updated 7 April 2026</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter uppercase mb-4">Battle Tested: How We Built Agentbot in the Trenches</h1>
          <p className="text-xl text-zinc-400">
            No VC pitch decks. No marketing fluff. Just builders building.
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <p>
            We didn&apos;t build Agentbot in a nice office. We built it <strong>living in the field</strong> - 
            deployed on servers, running in production, breaking in real-time.
          </p>

          <h2>The Problem</h2>
          <p>
            Every &quot;AI agent platform&quot; we tried was the same: beautiful landing pages, 
            broken deployments, and support tickets that never got answered. 
            They were built to <em>look</em> like they worked. Not actually work.
          </p>

          <h2>Our Approach</h2>
          <p>
            We deployed our own agents. Every single day. We ran baseFM 24/7 - 
            real users, real money, real problems. When something broke, 
            <strong>we felt it immediately</strong>.
          </p>

          <ul>
            <li><strong>60-second deployments</strong> - not because it sounds good, but because we were tired of waiting</li>
            <li><strong>OpenClaw 2026.4.1</strong> - the runtime that actually works, now open source v1.0.0</li>
            <li><strong>MiMo-V2-Pro</strong> - Xiaomi&apos;s 1T+ model with 1M context, #1 in programming benchmarks</li>
            <li><strong>No credit system</strong> - users bring their own keys, we don&apos;t hold your money</li>
          </ul>

          <h2>What We Learned</h2>
          <p>
            The hard way:
          </p>
          <ul>
            <li>Docker doesn&apos;t care about your feelings</li>
            <li>AI APIs go down at 3am</li>
            <li>Telegram has rate limits (who knew?)</li>
            <li>Users will find bugs you never imagined</li>
            <li>Security isn&apos;t optional — we built BotID protection</li>
          </ul>

          <h2>What We Built</h2>
          <p>
            Since March, we shipped a lot. Here&apos;s what&apos;s running in production now:
          </p>

          <h3>Core Infrastructure</h3>
          <ul>
            <li><strong>Concurrent Tool Orchestration</strong> — agents execute read-only tools in parallel via Promise.all, mutating tools stay serial</li>
            <li><strong>Tiered Permission System</strong> — SAFE/DANGEROUS/DESTRUCTIVE classification with dashboard approval workflow</li>
            <li><strong>Encrypted Per-User API Keys</strong> — Bankr keys stored with AES-256-GCM, each user has their own</li>
            <li><strong>Maintenance Page</strong> — liveness + readiness checks, one-click doctor --fix, migration guides</li>
            <li><strong>Dashboard Performance</strong> — reduced INP from 1568ms to under 200ms via lazy-loading</li>
          </ul>

          <h3>New Features</h3>
          <ul>
            <li><strong><Link href="/jobs" className="text-green-400">Jobs Board</Link></strong> — hire talent or find roles in the agent ecosystem, integrates with git-city API</li>
            <li><strong><Link href="/sponsor" className="text-green-400">GitHub Sponsors</Link></strong> — support the platform, tier options from $10-200/mo</li>
            <li><strong><Link href="/dashboard/git-city" className="text-green-400">Git City</Link></strong> — analyze any GitHub repo as a 3D city, view commits, contributors, stars</li>
            <li><strong>Skills Marketplace</strong> — 11 music-specific skills (Visual Synthesizer, Track Archaeologist, Royalty Tracker, etc.)</li>
            <li><strong>GitHub Sponsors Profile</strong> — goal set to 5 sponsors, tier descriptions updated</li>
          </ul>

          <h3>Open Source</h3>
          <p>
            <a href="https://github.com/Eskyee/agentbot-opensource/releases/tag/v1.0.0" className="text-green-400 hover:underline" target="_blank" rel="noopener noreferrer">
              agentbot-opensource v1.0.0
            </a>{' '} is now live. MIT licensed, clean history, self-hostable. 
            Includes full platform architecture, Docker Compose, Prisma schema, GitHub Actions CI.
          </p>

          <h2>What&apos;s Different</h2>
          <p>
            Agentbot runs <Link href="/dashboard" className="text-green-400 hover:underline">in production right now</Link>. 
            Our own agents use it daily. When you deploy, you&apos;re using the same infrastructure we trust with our own projects.
          </p>
          <p>
            No sales team. No demo environments that don&apos;t match production. 
            Just the real thing.
          </p>

          <h2>The Numbers</h2>
          <p>
            We don&apos;t do vanity metrics. Here&apos;s what&apos;s actually running:
          </p>
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-zinc-900 p-4 border border-zinc-800">
              <div className="text-3xl font-bold text-green-400">10K+</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest">Discord Members</div>
            </div>
            <div className="bg-zinc-900 p-4 border border-zinc-800">
              <div className="text-3xl font-bold text-green-400">50M+</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest">Base Network Transactions</div>
            </div>
            <div className="bg-zinc-900 p-4 border border-zinc-800">
              <div className="text-3xl font-bold text-green-400">24/7</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest">baseFM Uptime</div>
            </div>
            <div className="bg-zinc-900 p-4 border border-zinc-800">
              <div className="text-3xl font-bold text-green-400">99.9%</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest">SLA on Label Tier</div>
            </div>
          </div>

          <h2>What People Are Building</h2>
          <p>
            Real builders, real projects:
          </p>
          <ul>
            <li><strong>&quot;Finally an agent platform that doesn&apos;t need a PhD to use.&quot;</strong> — Indie label running promo campaigns</li>
            <li><strong>&quot;baseFM is the future of radio. Agents DJing 24/7 is wild.&quot;</strong> — Music tech founder</li>
            <li><strong>&quot;The x402 payments just work. My agent earns USDC while I sleep.&quot;</strong> — Developer</li>
            <li><strong>&quot;Self-hosted v1.0.0 in under 30 minutes. Cleanest codebase I&apos;ve seen.&quot;</strong> — Open source maintainer</li>
          </ul>

          <h2>Roadmap: Q2-Q3 2026</h2>
          <p>
            What&apos;s coming next:
          </p>
          <ul>
            <li><strong>Agent Definition Files</strong> — markdown + YAML frontmatter for declarative agent configs</li>
            <li><strong>Internal @agentbot/* Packages</strong> — replacing high-risk public deps with audited internals</li>
            <li><strong>WebSocket Permission Notifications</strong> — real-time approval flow, no polling</li>
            <li><strong>Speed Insights Targets</strong> — /dashboard INP under 200ms, /settings under 500ms</li>
            <li><strong>Agent Swarms UI</strong> — visual orchestration of multi-agent crews</li>
            <li><strong>Mobile App</strong> — manage agents from iOS/Android</li>
          </ul>

          <h2>How We Compare</h2>
          <p>
            vs the &quot;big names&quot;:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm my-6">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 text-zinc-400">Feature</th>
                  <th className="text-center py-2 text-zinc-400">Agentbot</th>
                  <th className="text-center py-2 text-zinc-400">Others</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-800">
                  <td className="py-2">Self-hostable</td>
                  <td className="text-center text-green-400">✓ v1.0.0</td>
                  <td className="text-center text-zinc-600">✗</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="py-2">USDC payments (x402)</td>
                  <td className="text-center text-green-400">✓ Native</td>
                  <td className="text-center text-zinc-600">✗</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="py-2">BYOK (no markup)</td>
                  <td className="text-center text-green-400">✓ Cost + 0%</td>
                  <td className="text-center text-zinc-600">2-5x markup</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="py-2">Music-specific skills</td>
                  <td className="text-center text-green-400">✓ 11 skills</td>
                  <td className="text-center text-zinc-600">✗</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="py-2">Open source runtime</td>
                  <td className="text-center text-green-400">✓ OpenClaw</td>
                  <td className="text-center text-zinc-600">Proprietary</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="py-2">Permission system</td>
                  <td className="text-center text-green-400">✓ SAFE/DANGER/DESTROY</td>
                  <td className="text-center text-zinc-600">Basic</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Living Document</h2>
          <p>
            This post isn&apos;t a one-time thing. We update it as we ship. 
            Check back regularly or <Link href="/news" className="text-green-400 hover:underline">follow our news page</Link> for the latest.
          </p>

          <h2>Join Us</h2>
          <p>
            If you&apos;re a builder who wants an agent platform that actually works - 
            not one built for pitch decks - try Agentbot.
          </p>
          <p>
            <Link href="/signup" className="text-green-400 font-bold hover:underline">
            Get started →
            </Link>
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800">
          <Link href="/blog" className="text-zinc-400 hover:text-white">
            ← Back to Blog
          </Link>
        </div>
      </article>
    </main>
  );
}