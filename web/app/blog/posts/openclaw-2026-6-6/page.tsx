import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OpenClaw v2026.6.6 — Stability, Security & Performance',
  description:
    'OpenClaw 2026.6.6 is now the default runtime on Agentbot. Stability fixes, security hardening, and performance improvements across the gateway.',
}

export default function BlogPost() {
  return (
    <article className="prose prose-invert max-w-3xl mx-auto px-6 py-24">
      <p className="text-zinc-500 text-sm">12 Jun 2026 · Agentbot Team</p>

      <h1 className="text-3xl font-bold mt-4">
        OpenClaw v2026.6.6 — Stability, Security &amp; Performance
      </h1>

      <p className="text-zinc-400 text-lg mt-4">
        OpenClaw 2026.6.6 is now the default runtime across all Agentbot deployments.
        This release focuses on stability fixes, security hardening, and performance
        improvements across the gateway.
      </p>

      <h2 className="text-2xl font-bold mt-10">What Changed</h2>

      <h3 className="text-xl font-bold mt-6">Stability</h3>
      <ul>
        <li><strong>Gateway resilience</strong> — improved error recovery for transient provider failures</li>
        <li><strong>Session persistence</strong> — fixed edge cases where long-running sessions could lose context</li>
        <li><strong>WebSocket stability</strong> — reduced reconnection storms under high load</li>
      </ul>

      <h3 className="text-xl font-bold mt-6">Security</h3>
      <ul>
        <li><strong>SSRF hardening</strong> — expanded blocklist for internal network ranges</li>
        <li><strong>Input validation</strong> — stricter sanitization on webhook payloads</li>
        <li><strong>Dependency updates</strong> — patched 3 moderate vulnerabilities in transitive deps</li>
      </ul>

      <h3 className="text-xl font-bold mt-6">Performance</h3>
      <ul>
        <li><strong>Cold start reduction</strong> — gateway initializes 15% faster with lazy module loading</li>
        <li><strong>Memory efficiency</strong> — reduced baseline memory footprint by ~8% through object pooling</li>
        <li><strong>Streaming improvements</strong> — lower latency on first token for streaming responses</li>
      </ul>

      <h2 className="text-2xl font-bold mt-10">Upgrading</h2>

      <p>
        Agentbot runs OpenClaw as a managed runtime. All new deployments and restarts
        automatically use 2026.6.6 — no action required.
      </p>

      <p>For self-hosted OpenClaw instances:</p>

      <pre className="bg-zinc-900 rounded-lg p-4 text-sm overflow-x-auto">
        <code>npm install -g openclaw@2026.6.6</code>
      </pre>

      <h2 className="text-2xl font-bold mt-10">Breaking Changes</h2>

      <p>
        None. This is a backwards-compatible patch release. All existing configurations,
        channels, and skills work without modification.
      </p>

      <h2 className="text-2xl font-bold mt-10">What&apos;s Next</h2>

      <p>
        We&apos;re working on the next major feature release with improved multi-agent
        coordination and enhanced mobile node capabilities. Stay tuned.
      </p>

      <div className="mt-12 p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
        <p className="text-sm text-zinc-400">
          <strong className="text-white">OpenClaw 2026.6.6</strong> is now the default runtime
          on Agentbot. Self-hosted users can upgrade with{' '}
          <code>npm install -g openclaw@2026.6.6</code>. No breaking changes.
        </p>
      </div>
    </article>
  )
}
