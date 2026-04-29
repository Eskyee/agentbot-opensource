import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OpenClaw v2026.4.15 + Operator Mode | Agentbot Blog',
  description: 'OpenClaw 2026.4.15 ships dreaming fixes, security hardening, and 60+ contributor patches. Plus: Operator Mode — a guided onboarding layer for new users.',
  keywords: ['Agentbot', 'OpenClaw', '2026.4.15', 'Operator Mode', 'onboarding', 'dreaming', 'security'],
  openGraph: {
    title: 'OpenClaw v2026.4.15 + Operator Mode',
    description: 'Dreaming fixes, 60+ patches, and a new guided experience for beginners. Advanced Mode untouched.',
    url: 'https://agentbot.sh/blog/posts/openclaw-v2026-4-15-operator-mode',
  },
}

export default function OpenClawV2026415OperatorMode() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          &larr; Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">17 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              OpenClaw v2026.4.15 + Operator Mode
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 border border-orange-800/50 text-zinc-400">Release</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">OpenClaw</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Operator Mode</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Onboarding</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-8">
            Two things shipping today. First: OpenClaw v2026.4.15 &mdash; the biggest patch release yet, with
            dreaming fixes, security hardening, and 60+ contributor patches. Second: <strong>Operator Mode</strong> &mdash;
            a guided onboarding layer that makes it easy for new users to deploy their first agent in under two minutes,
            without touching any of the advanced controls.
          </p>

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            OpenClaw v2026.4.15
          </h2>
          <p className="text-zinc-300 mb-4">
            This release has the highest contributor count we&apos;ve seen. Highlights:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><strong className="text-white">Dreaming storage mode change</strong> &mdash; default dreaming storage moved from <code className="text-zinc-200">inline</code> to <code className="text-zinc-200">separate</code>, so dream phase blocks land in <code className="text-zinc-200">memory/dreaming/</code> instead of bloating daily memory files. This fixes OOM crashes in constrained containers</li>
            <li><strong className="text-white">Dreaming session ingestion fix</strong> &mdash; narrative transcripts from dreaming are now skipped from session-store metadata before bootstrap records land, preventing dream prose from polluting session ingestion</li>
            <li><strong className="text-white">Anthropic Claude Opus 4.7</strong> &mdash; default model selections, opus aliases, CLI defaults, and bundled image understanding</li>
            <li><strong className="text-white">Gemini TTS</strong> &mdash; text-to-speech support added to the bundled Google plugin, including voice selection and WAV/PCM output</li>
            <li><strong className="text-white">Model Auth status card</strong> &mdash; new Control UI card showing OAuth token health and provider rate-limit pressure at a glance</li>
            <li><strong className="text-white">LanceDB cloud storage</strong> &mdash; durable memory indexes can now run on remote object storage instead of local disk only</li>
            <li><strong className="text-white">GitHub Copilot embeddings</strong> &mdash; dedicated embedding provider for memory search with token refresh and safer payload validation</li>
            <li><strong className="text-white">Local model lean mode</strong> &mdash; <code className="text-zinc-200">agents.defaults.experimental.localModelLean: true</code> drops heavyweight tools for weaker local setups</li>
          </ul>

          <h3 className="text-xl font-bold uppercase tracking-tight mb-3 text-white">
            Security Fixes
          </h3>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><strong className="text-white">Gateway tool trust anchor</strong> &mdash; trusted local MEDIA tool-result passthrough now anchored on exact raw names of registered built-in tools. Client tool definitions that normalize-collide with a built-in are rejected with 400</li>
            <li><strong className="text-white">Secrets in exec approvals</strong> &mdash; inline approval review no longer leaks credential material in rendered prompt content</li>
            <li><strong className="text-white">MCP loopback auth</strong> &mdash; bearer comparison switched to constant-time <code className="text-zinc-200">safeEqualSecret</code>, browser-origin requests rejected before auth gate</li>
            <li><strong className="text-white">Feishu webhook hardening</strong> &mdash; fail-closed on missing encryptKey and blank callback tokens</li>
            <li><strong className="text-white">Workspace file safety</strong> &mdash; agents.files.get/set routed through shared fs-safe helpers, symlink aliases rejected</li>
          </ul>

          <h3 className="text-xl font-bold uppercase tracking-tight mb-3 text-white">
            Platform Stability
          </h3>
          <ul className="list-disc pl-6 text-zinc-300 mb-8 space-y-2">
            <li><strong className="text-white">WhatsApp reconnect fix</strong> &mdash; pending creds save queue drained before reopening sockets</li>
            <li><strong className="text-white">BlueBubbles catchup</strong> &mdash; persistent per-account cursor replays missed webhook messages after gateway restart</li>
            <li><strong className="text-white">Ollama model IDs</strong> &mdash; provider prefix stripped from chat request model IDs so configured refs stop 404ing</li>
            <li><strong className="text-white">Skills snapshot invalidation</strong> &mdash; cached snapshot version bumped on config writes to skills.*, fixing &quot;Tool not found&quot; loops</li>
            <li><strong className="text-white">Unknown tool guard</strong> &mdash; enabled by default, prevents hallucinated tools from looping until timeout</li>
            <li><strong className="text-white">TUI streaming watchdog</strong> &mdash; resets to idle after 30s of delta silence, guards against lost state events</li>
          </ul>

          <p className="text-zinc-300 mb-8">
            Full changelog: <a href="https://github.com/openclaw/openclaw/releases/tag/v2026.4.15" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-400 underline">v2026.4.15 on GitHub</a>.
            All existing agent containers will pick up the new version on next deploy.
          </p>

          <hr className="border-zinc-800 my-12" />

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            Operator Mode
          </h2>
          <p className="text-zinc-300 mb-4">
            Agentbot has always been built for power users. 50+ routes, 6 navigation sections, deep runtime controls,
            workflow editors, wallet management, skill configuration &mdash; that&apos;s the core product and it&apos;s
            not going anywhere.
          </p>
          <p className="text-zinc-300 mb-4">
            But we kept hearing the same thing from new users: <em>&quot;I just want to get an agent running.
            Where do I start?&quot;</em>
          </p>
          <p className="text-zinc-300 mb-4">
            <strong>Operator Mode</strong> is our answer. It&apos;s a thin, feature-flagged entry layer that sits
            on top of the existing system. It doesn&apos;t replace anything &mdash; it simplifies the first experience.
          </p>

          <h3 className="text-xl font-bold uppercase tracking-tight mb-3 text-white">
            What&apos;s New
          </h3>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><strong className="text-white">/app/start</strong> &mdash; Guided onboarding: pick a template, name your agent, launch in 3 clicks</li>
            <li><strong className="text-white">/app/templates</strong> &mdash; Starter templates: Music Promoter, Community Manager, Content Creator, Crypto Analyst, DJ Radio Host, Event Scout. Each creates a normal Workflow + Agent that&apos;s fully editable from Advanced Mode</li>
            <li><strong className="text-white">/app/activity</strong> &mdash; Activity feed: see everything happening with your agents in one place</li>
            <li><strong className="text-white">/app/tutorials</strong> &mdash; Step-by-step tutorials: deploy first agent, connect channels, explore skills, set up wallet, build workflows</li>
            <li><strong className="text-white">/app/advanced</strong> &mdash; One-click switch to the full Advanced Mode dashboard</li>
          </ul>

          <h3 className="text-xl font-bold uppercase tracking-tight mb-3 text-white">
            What Didn&apos;t Change
          </h3>
          <p className="text-zinc-300 mb-4">
            Everything. The entire advanced experience is untouched:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li>All 50+ existing routes work exactly as before</li>
            <li>No navigation items removed or reordered</li>
            <li>No runtime or OpenClaw execution behaviour changed</li>
            <li>No existing API response shapes modified</li>
            <li>No existing users forced into Operator Mode</li>
          </ul>

          <h3 className="text-xl font-bold uppercase tracking-tight mb-3 text-white">
            How Routing Works
          </h3>
          <p className="text-zinc-300 mb-4">
            New users (no agents, no workflows) see the guided experience by default.
            Existing users stay on Advanced Mode. Anyone can switch between modes at any time &mdash;
            the preference is saved and persists.
          </p>

          <h3 className="text-xl font-bold uppercase tracking-tight mb-3 text-white">
            Feature Flags
          </h3>
          <p className="text-zinc-300 mb-4">
            Operator Mode is behind three Vercel environment flags:
          </p>
          <ul className="list-disc pl-6 text-zinc-300 mb-4 space-y-2">
            <li><code className="text-zinc-200">OPERATOR_MODE_ENABLED</code> &mdash; master switch for guided routes</li>
            <li><code className="text-zinc-200">NEW_USER_OPERATOR_DEFAULT</code> &mdash; route first-time users to /app/start</li>
            <li><code className="text-zinc-200">SHOW_OPENCLAW_BADGE_IN_OPERATOR</code> &mdash; subtle &quot;Powered by OpenClaw&quot; in beginner mode</li>
          </ul>
          <p className="text-zinc-300 mb-8">
            Currently enabled in preview only. Production rollout will happen after internal testing.
          </p>

          <h3 className="text-xl font-bold uppercase tracking-tight mb-3 text-white">
            Templates Are Real Workflows
          </h3>
          <p className="text-zinc-300 mb-8">
            Every template launched from Operator Mode creates a real Workflow and Agent in the database &mdash;
            the same models used by Advanced Mode. There&apos;s no separate execution system. You can launch
            a Music Promoter from /app/templates, then open it in /dashboard/workflows and edit every node.
            Templates are presets, not cages.
          </p>

          <hr className="border-zinc-800 my-12" />

          <h2 className="text-2xl font-bold uppercase tracking-tight mb-4 text-white">
            What&apos;s Next
          </h2>
          <ul className="list-disc pl-6 text-zinc-300 mb-8 space-y-2">
            <li>More templates based on user feedback</li>
            <li>Tutorial system connected to achievement badges</li>
            <li>Operator Mode analytics to understand where new users get stuck</li>
            <li>Production rollout of Operator Mode after preview validation</li>
          </ul>

          <p className="text-zinc-300">
            Questions? Feedback? Join us on{' '}
            <a href="https://t.me/agentbotxyz" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-400 underline">Telegram</a>
            {' '}or open an issue on{' '}
            <a href="https://github.com/Eskyee/agentbot-opensource" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-400 underline">GitHub</a>.
          </p>
        </article>
      </div>
    </main>
  )
}
