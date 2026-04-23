import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Platform Guide — Agentbot',
  description: 'Learn how to use your Agentbot dashboard, OpenClaw runtime, and install skills.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-zinc-800 pb-10 last:border-none last:pb-0">
      <h2 className="text-lg font-bold tracking-tight text-white mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Q({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-zinc-300 mb-1">{q}</p>
      <div className="text-sm text-zinc-500 leading-relaxed">{children}</div>
    </div>
  )
}

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-black px-4 py-16 sm:px-8">
      <div className="mx-auto max-w-2xl space-y-12">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">Platform Guide</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">How Agentbot Works</h1>
          <p className="mt-3 text-zinc-500">
            Everything you need to understand your dashboard, your OpenClaw runtime, and how skills connect to make your agent useful.
          </p>
        </div>

        <Section title="Your Dashboard">
          <Q q="What is the dashboard?">
            The dashboard is mission control for your Agentbot instance. From here you can check your runtime status, manage your wallet, access baseFM, view your community rewards, and install skills onto your agent.
          </Q>
          <Q q="What do the status indicators mean?">
            <ul className="space-y-1">
              <li><span className="font-medium text-white">HEALTHY</span> — Runtime is online and responding normally.</li>
              <li><span className="font-medium text-white">STARTING</span> — Runtime is booting up. Wait 30–60 seconds then refresh.</li>
              <li><span className="font-medium text-white">STOPPED</span> — Runtime process has stopped. Use Start Machine to bring it back.</li>
              <li><span className="font-medium text-white">UNKNOWN</span> — We could not fully probe your runtime. Check your connection or use Retry Probe.</li>
            </ul>
          </Q>
          <Q q="What does 'FFmpeg: Unknown' mean?">
            When your runtime&apos;s <code className="text-zinc-300">/api/status</code> endpoint is unreachable, we cannot confirm whether FFmpeg is installed. It does not mean FFmpeg is missing — it means the runtime is not fully responding. If your runtime shows Healthy but FFmpeg shows Unknown, try a Redeploy or Upgrade to get the latest managed image, which includes FFmpeg pre-installed.
          </Q>
          <Q q="What does 'FFmpeg: Not Installed' mean?">
            Your runtime responded and reported that FFmpeg is not present on this image. FFmpeg is required for autonomous baseFM broadcasting. To fix it: hit <strong className="text-zinc-300">Upgrade</strong> on your dashboard — this redeploys with the latest managed OpenClaw image which has FFmpeg pre-installed. If Upgrade does not fix it, use <strong className="text-zinc-300">Agentbot Recovery</strong> to repair the runtime config. The install typically takes under 2 minutes.
          </Q>
          <Q q="How do I restart or repair my runtime?">
            From the Instance Controls panel on your dashboard:
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li><strong className="text-zinc-300">Start Machine</strong> — brings a stopped instance back online</li>
              <li><strong className="text-zinc-300">Redeploy or Upgrade</strong> — pulls the latest managed runtime image</li>
              <li><strong className="text-zinc-300">Agentbot Recovery</strong> — repairs tokens, proxy wiring, and config drift</li>
              <li><strong className="text-zinc-300">Retry Probe</strong> — re-runs health checks without changing anything</li>
            </ul>
          </Q>
        </Section>

        <Section title="OpenClaw Runtime">
          <Q q="What is OpenClaw?">
            OpenClaw is the AI agent runtime that runs inside your Agentbot container. It is the actual intelligence layer — it runs your chosen AI model, handles conversations, executes skills, manages your wallet, and connects to the services you configure.
          </Q>
          <Q q="Where does my OpenClaw run?">
            Your OpenClaw instance runs on Railway, managed by Agentbot. You get a dedicated subdomain like <code className="text-zinc-300">agentbot-agent-YOUR_ID-production.up.railway.app</code>. You can reach it directly, or access it through the Agentbot dashboard.
          </Q>
          <Q q="How do I open my agent?">
            Click <strong className="text-zinc-300">Open</strong> in the Instance Controls section of your dashboard. This opens your agent&apos;s control interface where you can send messages, configure skills, and check live status.
          </Q>
          <Q q="What is the OpenClaw version?">
            The version is shown in the Runtime Probe section. Agentbot ships managed runtime images on a rolling basis. To get the latest version with all fixes and improvements, use <strong className="text-zinc-300">Redeploy or Upgrade</strong>.
          </Q>
        </Section>

        <Section title="Skills and Missing Dependencies">
          <Q q="What are skills?">
            Skills are capabilities you install on your OpenClaw agent — things like web search, file handling, calendar access, 1Password integration, and more. Each skill adds a specific tool your agent can use in conversations.
          </Q>
          <Q q="What does 'missing dependencies' mean?">
            Some skills require external accounts or credentials to work. For example:
            <ul className="mt-2 space-y-1.5 list-none">
              <li className="flex gap-2"><span className="text-zinc-400 font-mono text-xs mt-0.5">1password</span><span>— Needs a 1Password Connect server URL and token</span></li>
              <li className="flex gap-2"><span className="text-zinc-400 font-mono text-xs mt-0.5">apple-notes</span><span>— Needs iCloud access configured on your runtime</span></li>
              <li className="flex gap-2"><span className="text-zinc-400 font-mono text-xs mt-0.5">google-calendar</span><span>— Needs Google OAuth credentials</span></li>
              <li className="flex gap-2"><span className="text-zinc-400 font-mono text-xs mt-0.5">slack</span><span>— Needs a Slack bot token</span></li>
            </ul>
            <p className="mt-2">These skills are installed but not yet active. To activate them, go to your Skills Manager inside OpenClaw and add the required API keys or credentials. The skill will show as active once its dependencies are satisfied.</p>
          </Q>
          <Q q="How do I fix a skill with missing dependencies?">
            <ol className="mt-1 space-y-1.5 list-decimal list-inside">
              <li>Click <strong className="text-zinc-300">Skills Manager</strong> from your dashboard sidebar or the Quick Links panel.</li>
              <li>Find the skill showing a warning or &apos;missing dependency&apos; status.</li>
              <li>Click the skill and follow the configuration steps — you&apos;ll be prompted for the required API key or credential.</li>
              <li>Save and the skill will activate automatically.</li>
            </ol>
          </Q>
          <Q q="Can I use my agent while skills have missing dependencies?">
            Yes. Skills with missing dependencies are simply inactive — they will not break your agent. Your agent still works normally using any other installed and configured skills.
          </Q>
          <Q q="Which skills work out of the box?">
            The core skills — web search, file handler, memory, and agent communication — are pre-configured and active on all instances. Skills that need external services (email, calendar, messaging platforms) require your credentials.
          </Q>
        </Section>

        <Section title="Signals and X Integration">
          <Q q="What is the Signals page?">
            <Link href="/dashboard/signals" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Signals</Link> is your real-time monitoring feed for X (Twitter). It shows incoming mentions for your connected account, your own recent posts, and a dedicated community feed. Use it to spot conversations to reply to without leaving Agentbot.
          </Q>
          <Q q="How do I connect my X account?">
            Go to <Link href="/settings" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Settings → Integrations</Link>. Paste your OAuth 2.0 user access token, refresh token, username, account ID, and scopes (typically <code className="text-zinc-300">tweet.read users.read tweet.write offline.access</code>). Saving <strong className="text-zinc-300">offline.access</strong> in scopes is required for the refresh token to keep working past 2 hours.
          </Q>
          <Q q="Why did Signals start 401ing?">
            OAuth 2.0 access tokens expire roughly every 2 hours. Agentbot now auto-refreshes the token on any 401 using your stored refresh token and retries the request. If 401s persist, your refresh token has been revoked — reconnect under Settings → Integrations.
          </Q>
          <Q q="Community feed — how do I change which community I see?">
            The Signals page defaults to community <code className="text-zinc-300">2031495203002134740</code>. Edit the Community ID input on the page and click reload. If X&apos;s community endpoint returns 404 or 403 on your tier, Agentbot automatically falls back to a recent-search query using context domain 131 (Communities) so posts still populate.
          </Q>
          <Q q="Does Signals poll automatically?">
            No — Signals loads on demand. X API is pay-as-you-go, so we keep it frugal: each section has a manual reload button. Use it sparingly.
          </Q>
        </Section>

        <Section title="Agentic Market (x402)">
          <Q q="Where did the embedded market go?">
            X (the browser security layer) blocks agentic.market from being iframed via <code className="text-zinc-300">X-Frame-Options: DENY</code>. The x402 dashboard now shows a preview card with a CTA to open <a href="https://agentic.market" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">agentic.market</a> in a new tab instead of a broken embed.
          </Q>
        </Section>

        <Section title="baseFM and DJ Streaming">
          <Q q="What is baseFM?">
            baseFM is Agentbot&apos;s live radio layer. RAVE token holders and community pass members can go live and stream audio to listeners through the baseFM platform. Your OpenClaw agent can also autonomously broadcast if FFmpeg is available on your runtime.
          </Q>
          <Q q="How do I go live on baseFM?">
            Go to <Link href="/dashboard/dj-stream" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">DJ Stream</Link> in your dashboard. Connect your Solana wallet with 1.25M+ RAVE tokens (or claim a community guest pass), then start your set. You&apos;ll get an RTMP stream key to use with OBS or your preferred broadcasting software.
          </Q>
          <Q q="Can I upload a pre-recorded mix?">
            Yes — go to <Link href="/dashboard/mixtape" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Mix Uploads</Link> (Collective plan or higher). Upload your audio file and schedule a broadcast time. Agentbot will auto-stream it to baseFM at the scheduled time using your runtime&apos;s FFmpeg broadcaster.
          </Q>
        </Section>

        <Section title="Community Rewards and Solana">
          <Q q="What are community rewards?">
            Holding Agentbot tokens on Solana unlocks platform credits, baseFM access, and exclusive perks. The more you hold, the higher your tier and the more credits you earn.
          </Q>
          <Q q="How do I claim my community rewards?">
            Click <strong className="text-zinc-300">Claim Credits</strong> at the top of your dashboard, or go to the <Link href="/claim" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Claim</Link> page. Connect your Solana wallet and verify your token balance. Credits are added to your account automatically.
          </Q>
          <Q q="What is the Agentbot token?">
            The Agentbot token is a Solana SPL token. Holders get baseFM streaming access, platform credits, and community governance perks. Find the token address and buy link on the <Link href="/dashboard/solana" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Solana</Link> page.
          </Q>
        </Section>

        <div className="flex flex-wrap gap-4 pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Go to Dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/dashboard/skills"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Skills Manager
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/dashboard/support"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Get Support
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </main>
  )
}
