import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OpenClaw v2026.4.9 — Dreaming, SSRF Hardening, Character QA & Android Pairing | Agentbot Blog',
  description: 'OpenClaw 2026.4.9: REM dream backfill with diary timeline UI, SSRF and node exec injection hardening, character-vibes QA evals, and a complete Android pairing overhaul.',
  keywords: ['Agentbot', 'OpenClaw', '2026.4.9', 'dreaming', 'SSRF', 'security', 'Android', 'character AI'],
  openGraph: {
    title: 'OpenClaw v2026.4.9 — Dreaming, Security & Android',
    description: 'REM backfill, SSRF hardening, character QA evals, Android pairing overhaul. All live.',
    url: 'https://agentbot.sh/blog/posts/openclaw-v2026-4-9',
  },
}

export default function OpenClawV202649() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          &larr; Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">9 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              OpenClaw v2026.4.9
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-blue-800/50 text-zinc-400">Release</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">OpenClaw</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Dreaming</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Security</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Android</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8">
            v2026.4.9 just shipped. Four focused areas this cycle: the dreaming system gets a major upgrade,
            security hardening against SSRF and node exec injection, new character-vibes QA evaluation framework,
            and a complete overhaul of Android device pairing. Here&apos;s what changed.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Dreaming: REM Backfill &amp; Diary Timeline UI
          </h2>
          <p className="text-zinc-300 mb-4">
            The experimental dreaming system introduced in v2026.4.5 now supports <strong>REM backfill</strong> &mdash;
            agents can retroactively process and consolidate memories from past conversations during idle periods.
            Think of it as your agent &quot;sleeping on it&quot; and waking up with better recall.
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><strong className="text-white">REM backfill pipeline</strong> &mdash; scans recent conversation history during idle cycles, identifies unprocessed memories, and promotes them through the dream consolidation pipeline</li>
            <li><strong className="text-white">Dream Diary timeline UI</strong> &mdash; new visual timeline in Control UI showing when your agent dreamed, what memories were consolidated, and the conceptual tags generated</li>
            <li><strong className="text-white">Configurable dream depth</strong> &mdash; control how far back the backfill reaches (default: 48h) and how aggressively memories are promoted</li>
            <li><strong className="text-white">Dream metrics</strong> &mdash; track consolidation counts, memory promotion rates, and dream cycle durations in the dashboard</li>
          </ul>
          <p className="text-zinc-300 mb-4">
            The diary UI is accessible via <code className="text-zinc-200">/dreaming</code> in the Control panel or
            the new &quot;Dreams&quot; tab in agent settings. Each dream entry shows the source conversations,
            the memories extracted, and how they connect to existing knowledge.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            SSRF &amp; Node Exec Injection Hardening
          </h2>
          <p className="text-zinc-300 mb-4">
            Critical security hardening in this release. Two vectors patched:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><strong className="text-white">SSRF blocklist expansion</strong> &mdash; extended coverage for IPv4-mapped IPv6 addresses, DNS rebinding via dual-stack resolvers, and cloud metadata endpoints (169.254.169.254, fd00::/8). The blocklist now catches ~40 additional bypass patterns identified through fuzzing</li>
            <li><strong className="text-white">Node exec injection guard</strong> &mdash; new sandbox layer around tool execution that prevents prompt-injected payloads from breaking out of the agent tool sandbox into host-level <code className="text-zinc-200">child_process</code> calls. All tool exec paths now run through a validated allowlist</li>
            <li><strong className="text-white">URL validation at parse time</strong> &mdash; URLs are now validated immediately on parse rather than at request time, closing a TOCTOU window where a valid URL could be swapped for a malicious one between validation and fetch</li>
          </ul>
          <p className="text-zinc-300 mb-4">
            If you run self-hosted OpenClaw, update immediately. These are defence-in-depth fixes &mdash; no known
            exploits in the wild, but the attack surface is now significantly smaller.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Character-Vibes QA Evals
          </h2>
          <p className="text-zinc-300 mb-4">
            New evaluation framework for testing whether your agent actually sounds like the character you configured.
            Character-vibes QA runs automated conversation probes against your agent&apos;s persona and scores
            responses on consistency, tone, vocabulary, and behavioral alignment.
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><strong className="text-white">Vibe scoring</strong> &mdash; 0-100 score across four dimensions: voice consistency, emotional range, knowledge boundaries, and refusal patterns</li>
            <li><strong className="text-white">Drift detection</strong> &mdash; alerts when your agent&apos;s responses start diverging from the configured persona (common after long conversations or memory accumulation)</li>
            <li><strong className="text-white">Probe library</strong> &mdash; built-in set of adversarial and edge-case prompts designed to test character boundaries (e.g., &quot;break character&quot; attempts, out-of-domain questions, emotional manipulation)</li>
            <li><strong className="text-white">CI integration</strong> &mdash; run <code className="text-zinc-200">openclaw eval --character</code> in your pipeline to gate deployments on persona quality</li>
          </ul>
          <p className="text-zinc-300 mb-4">
            This is particularly useful for music industry agents on Agentbot where persona consistency
            matters &mdash; your DJ agent shouldn&apos;t suddenly start talking like a customer support bot.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Android Pairing Overhaul
          </h2>
          <p className="text-zinc-300 mb-4">
            Complete rewrite of the Android device pairing flow. Previous implementation had reliability
            issues with WebSocket handshake on certain Android WebView versions and Samsung Internet.
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><strong className="text-white">QR-first pairing</strong> &mdash; scan a QR code from the Control UI to pair your Android device instantly. Falls back to manual token entry</li>
            <li><strong className="text-white">Persistent connection</strong> &mdash; paired devices now maintain connection through app backgrounding and network switches via a lightweight heartbeat protocol</li>
            <li><strong className="text-white">Push notification bridge</strong> &mdash; agent messages can now trigger Android push notifications even when the app is closed</li>
            <li><strong className="text-white">Samsung Internet fix</strong> &mdash; resolved a WebSocket upgrade header issue specific to Samsung Internet 24+ that caused pairing to silently fail</li>
          </ul>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Updating
          </h2>
          <p className="text-zinc-300 mb-4">
            All Agentbot managed containers auto-update on next deploy cycle. Self-hosted operators:
          </p>
          <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 overflow-x-auto mb-4">
{`docker pull ghcr.io/openclaw/openclaw:latest
openclaw --version  # should show 2026.4.9`}
          </pre>
          <p className="text-zinc-300 mb-4">
            Run <code className="text-zinc-200">openclaw doctor --fix</code> after updating to ensure
            all config paths are migrated. No breaking changes in this release.
          </p>

          <div className="border-t border-zinc-800 mt-8 pt-8 flex gap-4 flex-wrap text-sm">
            <Link href="/blog/posts/openclaw-v2026-4-5" className="text-zinc-400 hover:text-white">Previous: v2026.4.5 &rarr;</Link>
            <Link href="/solana" className="text-zinc-400 hover:text-white">Solana Integrations &rarr;</Link>
            <Link href="/token" className="text-zinc-400 hover:text-white">$AGENTBOT Token &rarr;</Link>
          </div>
        </article>
      </div>
    </main>
  )
}
