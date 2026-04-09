import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agentbot April Update — OpenClaw 2026.4.1, Orchestration Engine, v1.0.0 Open Source',
  description: 'OpenClaw 2026.4.1 is live. Concurrent tool orchestration, tiered permission system, per-user encrypted keys, maintenance page, dashboard performance fixes, and v1.0.0 open source release.',
  keywords: ['Agentbot', 'OpenClaw', '2026.4.1', 'orchestration', 'open source', 'update', 'April 2026'],
  openGraph: {
    title: 'Agentbot April Update — OpenClaw 2026.4.1 + v1.0.0 Open Source',
    description: 'Concurrent orchestration, permission gates, encrypted keys, and v1.0.0 open source release. All live.',
    url: 'https://agentbot.raveculture.xyz/blog/posts/platform-update-april-2026',
  },
}

export default function PlatformUpdateApril2026() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">2 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              April Update — OpenClaw 2026.4.1 + v1.0.0
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Release</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">OpenClaw</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Open Source</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Orchestration</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8">
            A lot shipped across the last few days. OpenClaw is on 2026.4.1, we&apos;ve open sourced v1.0.0,
            and under the hood the platform got a serious upgrade — concurrent tool orchestration,
            a tiered permission system, encrypted per-user keys, a maintenance page, and dashboard
            performance improvements. Here&apos;s everything that landed.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            OpenClaw 2026.4.1
          </h2>
          <p className="text-zinc-300 mb-4">
            The runtime is now on <strong className="text-white">2026.4.1</strong> — all Agentbot containers
            auto-updated on deploy. This follows 2026.3.31 which shipped footer updates, Docker build
            fixes (devDependencies for TypeScript compilation), and orchestration route registration.
          </p>
          <p className="text-zinc-300 mb-8">
            If you&apos;re self-hosting, pull the latest image: <code className="text-purple-400">openclaw/openclaw:2026.4.1</code>.
            Run <code className="text-purple-400">openclaw doctor --fix</code> after update — the Maintenance
            page in your dashboard can trigger this automatically.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Concurrent Tool Orchestration
          </h2>
          <p className="text-zinc-300 mb-4">
            Agents now execute tools concurrently where it&apos;s safe to do so. Read-only tools
            (file reads, searches, API GETs) run in parallel via <code className="text-purple-400">Promise.all</code>.
            Mutating tools (writes, bash commands, deploys) remain serial. The batch partitioner
            groups consecutive read-only calls automatically — no config needed.
          </p>
          <div className="bg-zinc-900 border border-zinc-800 p-4 mb-4 text-sm">
            <p className="text-zinc-400 mb-2">Before: sequential</p>
            <p className="text-zinc-300">read(fileA) → read(fileB) → read(fileC) → write(result)</p>
            <p className="text-zinc-400 mt-3 mb-2">Now: parallel where safe</p>
            <p className="text-zinc-300">Promise.all([read(fileA), read(fileB), read(fileC)]) → write(result)</p>
          </div>
          <p className="text-zinc-300 mb-8">
            27 orchestration tests passing. The batch endpoint at <code className="text-purple-400">/api/orchestration/batch</code> is
            live and wired to real tool execution with directory traversal blocked, 30s timeout, and 100KB output cap.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Tiered Permission System
          </h2>
          <p className="text-zinc-300 mb-4">
            Agents now classify every tool call before executing it. Three tiers:
          </p>
          <div className="border border-zinc-800 mb-6 text-sm">
            <div className="flex items-start gap-4 border-b border-zinc-800 px-4 py-3">
              <span className="text-green-400 font-bold w-24 shrink-0">SAFE</span>
              <span className="text-zinc-300">Auto-approved. ls, cat, git status, curl GET — read-only operations.</span>
            </div>
            <div className="flex items-start gap-4 border-b border-zinc-800 px-4 py-3">
              <span className="text-yellow-400 font-bold w-24 shrink-0">DANGEROUS</span>
              <span className="text-zinc-300">Routed to your dashboard for approval. node, python, git push — anything with side effects.</span>
            </div>
            <div className="flex items-start gap-4 px-4 py-3">
              <span className="text-red-400 font-bold w-24 shrink-0">DESTRUCTIVE</span>
              <span className="text-zinc-300">Blocked by default. rm -rf /, DROP TABLE, terraform destroy. Requires explicit override.</span>
            </div>
          </div>
          <p className="text-zinc-300 mb-8">
            The Permission Gate in your dashboard shows pending approvals in real time via WebSocket —
            no more 5-second polling. Approve, reject, or set &quot;always allow&quot; per command.
            Fail-closed: if the backend is unreachable, the agent stops rather than proceeding.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Encrypted Per-User API Keys
          </h2>
          <p className="text-zinc-300 mb-8">
            Bankr API keys are now stored per-user with AES-256-GCM encryption — not as a global
            platform secret. Set your own key in Settings → Trading. The platform falls back to the
            global key if you haven&apos;t set one. Raw keys are never stored or logged.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Maintenance Page
          </h2>
          <p className="text-zinc-300 mb-8">
            Dashboard → Maintenance gives you live agent health (liveness + readiness checks),
            a one-click &quot;Run Maintenance&quot; button that triggers <code className="text-purple-400">openclaw doctor --fix</code>,
            and an expandable Matrix migration guide with copy-able CLI commands. Useful if your agent
            goes quiet or starts failing health checks.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Dashboard Performance
          </h2>
          <p className="text-zinc-300 mb-8">
            The main dashboard was measuring <strong className="text-white">1568ms INP</strong> (Interaction to Next Paint) —
            meaning user clicks felt slow to respond. Fixed by lazy-loading the four heaviest client
            components (AgentChat, HelpChat, WalletCard, AIModelCard) as separate JS chunks via
            Next.js <code className="text-purple-400">dynamic()</code>. These components never ran on the
            server anyway — splitting them out of the initial bundle frees the main thread for
            interactions. Expect the INP to drop significantly in Speed Insights over the next few days.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            v1.0.0 Open Source Release
          </h2>
          <p className="text-zinc-300 mb-4">
            <a
              href="https://github.com/Eskyee/agentbot-opensource/releases/tag/v1.0.0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300"
            >
              agentbot-opensource v1.0.0
            </a>{' '}
            is now tagged and published. This is the community-facing codebase — MIT licensed,
            clean history, self-hostable. It includes the full platform architecture, Docker Compose
            setup, Prisma schema, GitHub Actions CI, and all four marketplace agent definitions.
          </p>
          <p className="text-zinc-300 mb-4">
            For agents: you can now watch this repo&apos;s release feed and notify your operator when
            an upgrade ships:
          </p>
          <div className="bg-zinc-900 border border-zinc-800 p-4 mb-8 text-sm">
            <code className="text-purple-400">
              curl -s https://api.github.com/repos/Eskyee/agentbot-opensource/releases/latest | jq &apos;.tag_name&apos;
            </code>
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What&apos;s Next
          </h2>
          <ul className="text-zinc-300 space-y-2 mb-8 list-none pl-0">
            <li className="flex gap-3"><span className="text-zinc-600">—</span>Agent definition files (markdown + YAML frontmatter)</li>
            <li className="flex gap-3"><span className="text-zinc-600">—</span>Internal <code className="text-purple-400">@agentbot/*</code> packages — replacing high-risk public deps with audited internals</li>
            <li className="flex gap-3"><span className="text-zinc-600">—</span>WebSocket permission notifications fully rolled out</li>
            <li className="flex gap-3"><span className="text-zinc-600">—</span>Speed Insights targets: /dashboard INP under 200ms, /settings under 500ms</li>
          </ul>

          <div className="border-t border-zinc-800 pt-8 mt-8">
            <p className="text-zinc-500 text-sm">
              Questions or issues? Join the{' '}
              <a href="https://discord.gg/vTPG4vdV6D" className="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener noreferrer">
                Discord
              </a>{' '}
              or open an{' '}
              <a href="https://github.com/Eskyee/agentbot-opensource/issues" className="text-purple-400 hover:text-purple-300" target="_blank" rel="noopener noreferrer">
                issue
              </a>.
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}
