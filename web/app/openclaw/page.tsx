import Link from 'next/link'
import type { Metadata } from 'next'
import { buildAppUrl } from '@/app/lib/app-url'

export const metadata: Metadata = {
  title: 'OpenClaw — The Runtime Behind Agentbot',
  description: 'OpenClaw is the self-hosted AI agent gateway that powers Agentbot. Multi-channel, multi-agent, always on. Discord, Telegram, WhatsApp, iMessage, Signal, Slack — one gateway.',
  keywords: ['OpenClaw', 'AI agent gateway', 'self-hosted AI', 'multi-channel agent', 'Agentbot runtime', 'open source AI gateway'],
  openGraph: {
    title: 'OpenClaw — The Runtime Behind Agentbot',
    description: 'Self-hosted AI agent gateway. Multi-channel. Multi-agent. Always on.',
    url: buildAppUrl('/openclaw'),
  },
  alternates: {
    canonical: buildAppUrl('/openclaw'),
  },
}

const channels = [
  'Discord', 'Telegram', 'WhatsApp', 'iMessage', 'Signal',
  'Slack', 'Matrix', 'Microsoft Teams', 'Google Chat', 'IRC',
  'Nostr', 'Twitch', 'Zalo', 'WeChat', 'LINE', 'Feishu',
  'Mattermost', 'QQ Bot', 'SMS', 'WebChat',
]

const features = [
  {
    title: 'Multi-Channel Gateway',
    body: 'One Gateway process serves 20+ messaging platforms simultaneously. Discord, Telegram, WhatsApp, iMessage, Signal, Slack, Matrix, Microsoft Teams — all from a single instance.',
  },
  {
    title: 'Multi-Agent Routing',
    body: 'Isolated sessions per agent, workspace, or sender. Route different channels to different agents. Each agent gets its own memory, skills, and personality.',
  },
  {
    title: '35+ Model Providers',
    body: 'Anthropic, OpenAI, Google, MiMo, and more. Custom and self-hosted providers supported — vLLM, SGLang, Ollama, any OpenAI-compatible endpoint.',
  },
  {
    title: 'Media In & Out',
    body: 'Images, audio, video, and documents. Voice note transcription. Text-to-speech. Image and video generation. Full multimodal support.',
  },
  {
    title: 'Tools & Automation',
    body: 'Browser automation, shell exec, sandboxing, web search (Brave, Perplexity, Exa, and more), cron jobs, heartbeat scheduling, skills, and plugins.',
  },
  {
    title: 'Mobile Nodes',
    body: 'iOS and Android companion apps with pairing, Canvas, camera, screen recording, location, and voice-enabled workflows.',
  },
]

const quickStart = [
  { step: '1', title: 'Install', code: 'npm install -g openclaw@latest' },
  { step: '2', title: 'Onboard', code: 'openclaw onboard --install-daemon' },
  { step: '3', title: 'Dashboard', code: 'openclaw dashboard' },
]

export default function OpenClawPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono overflow-x-hidden">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 py-24 sm:py-36">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <div className="inline-block px-3 py-1 border border-orange-500/30 text-orange-500 text-[10px] uppercase tracking-widest">
              Open Source
            </div>
            <div className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest">
              MIT Licensed
            </div>
            <a
              href="https://github.com/openclaw/openclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-3 py-1 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors"
            >
              GitHub →
            </a>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.9]">
            Open<span className="text-orange-500">Claw</span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
            The self-hosted AI agent gateway that powers Agentbot.
            Multi-channel. Multi-agent. Always on. Run one Gateway and connect
            every chat app you use — from Discord to WhatsApp to iMessage.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="https://docs.openclaw.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] bg-white text-black px-5 py-2.5 font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Read the Docs
            </a>
            <Link
              href="/signup"
              className="text-[11px] border border-zinc-700 text-zinc-300 px-5 py-2.5 uppercase tracking-widest hover:text-white hover:border-zinc-500 transition-colors"
            >
              Deploy with Agentbot
            </Link>
          </div>
        </div>
      </section>

      {/* What is OpenClaw */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">What is OpenClaw</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-8">
            Your agent&apos;s <span className="text-orange-500">brain.</span>
          </h2>
          <div className="space-y-6 text-zinc-400 text-sm leading-relaxed max-w-lg">
            <p>
              OpenClaw is a self-hosted gateway that connects your messaging apps to AI
              coding agents. You run a single Gateway process on your own machine or server,
              and it becomes the bridge between every chat app and an always-available AI assistant.
            </p>
            <p>
              Agentbot deploys OpenClaw in the cloud for you — no terminal, no server setup,
              no config files. Your agent runs 24/7 on Railway with MiMo V2.5 Pro as the
              default model. But the runtime is OpenClaw — open source, battle-tested, and
              community-driven.
            </p>
            <p>
              If you ever want to run it yourself, it takes 5 minutes and a single npm command.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">Architecture</div>
          <div className="grid sm:grid-cols-3 gap-px bg-zinc-900">
            {[
              {
                title: 'Chat Apps',
                body: 'Discord, Telegram, WhatsApp, iMessage, Signal, Slack, and 15+ more. Your agent talks to you wherever you already are.',
              },
              {
                title: 'Gateway',
                body: 'Single process that handles routing, sessions, auth, media, and tool execution. The central nervous system.',
              },
              {
                title: 'Agent Runtime',
                body: 'AI model + tools + memory + skills. Streaming responses, multi-agent isolation, cron scheduling, and file access.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">{item.title}</div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">Capabilities</div>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-900">
            {features.map((f) => (
              <div key={f.title} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">{f.title}</div>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Channels</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-8">
            20+ platforms. <span className="text-orange-500">One gateway.</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {channels.map((ch) => (
              <span
                key={ch}
                className="px-3 py-1.5 border border-zinc-800 text-zinc-500 text-[10px] uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-colors"
              >
                {ch}
              </span>
            ))}
          </div>
          <p className="text-zinc-600 text-xs mt-6 max-w-lg">
            Plus plugin channels: Feishu, LINE, Mattermost, Nextcloud Talk, Synology Chat, Tlon, Twitch, Voice Call, and more.
          </p>
        </div>
      </section>

      {/* Agentbot + OpenClaw */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Agentbot × OpenClaw</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-8">
            Managed runtime. <span className="text-orange-500">Zero friction.</span>
          </h2>
          <div className="space-y-6 text-zinc-400 text-sm leading-relaxed max-w-lg">
            <p>
              Agentbot wraps OpenClaw in a managed cloud deployment. You get the full power
              of the runtime — channels, tools, memory, skills, multi-agent routing — without
              touching a terminal.
            </p>
            <p>
              Every Agentbot plan includes a dedicated OpenClaw instance running on Railway,
              with MiMo V2.5 Pro as the default model. Connect Telegram, Discord, or WhatsApp
              in minutes. Install skills. Set up cron jobs. Your agent works while you sleep.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-900 mt-10">
            {[
              { title: 'Self-Hosted', body: 'Run on your own hardware. npm install, onboard, done. Full control, full privacy.' },
              { title: 'Agentbot Cloud', body: 'Deploy in one click. 24/7 uptime. MiMo inference included. No server management.' },
            ].map((item) => (
              <div key={item.title} className="bg-black p-6 sm:p-8">
                <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">{item.title}</div>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start (self-hosted) */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Quick Start</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-8">
            5 minutes. <span className="text-orange-500">Three commands.</span>
          </h2>
          <div className="space-y-4">
            {quickStart.map((s) => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="w-8 h-8 flex items-center justify-center border border-zinc-800 text-orange-500 text-xs font-bold shrink-0">
                  {s.step}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{s.title}</div>
                  <code className="text-sm text-zinc-300 font-mono bg-zinc-950 px-3 py-1.5 inline-block border border-zinc-800">
                    {s.code}
                  </code>
                </div>
              </div>
            ))}
          </div>
          <p className="text-zinc-600 text-xs mt-6">
            Requires Node 24 (or 22.19+). An API key from any model provider. Or skip the terminal —{' '}
            <Link href="/signup" className="text-orange-500 hover:underline">deploy on Agentbot instead</Link>.
          </p>
        </div>
      </section>

      {/* Onboarding Wizard */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Onboarding</div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-8">
            One wizard. <span className="text-orange-500">Everything configured.</span>
          </h2>
          <div className="space-y-6 text-zinc-400 text-sm leading-relaxed max-w-lg mb-10">
            <p>
              <code className="text-zinc-300">openclaw onboard</code> walks you through the entire setup in
              one guided flow. Model provider, API key, workspace, gateway config, channels, daemon
              install, health check, and skills — all in one command.
            </p>
          </div>

          {/* QuickStart vs Advanced */}
          <div className="grid sm:grid-cols-2 gap-px bg-zinc-900 mb-10">
            <div className="bg-black p-6 sm:p-8">
              <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">QuickStart</div>
              <ul className="space-y-2 text-zinc-500 text-sm">
                <li>Local gateway on loopback</li>
                <li>Port 18789, token auth (auto-generated)</li>
                <li>DM isolation per channel/peer</li>
                <li>Tailscale exposure off</li>
                <li>Telegram + WhatsApp allowlist defaults</li>
                <li>Recommended skills installed</li>
              </ul>
            </div>
            <div className="bg-black p-6 sm:p-8">
              <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">Advanced</div>
              <ul className="space-y-2 text-zinc-500 text-sm">
                <li>Full control over every step</li>
                <li>Custom provider (OpenAI/Anthropic-compatible)</li>
                <li>Remote gateway connection</li>
                <li>Channel selection and config</li>
                <li>Daemon install (LaunchAgent/systemd/Windows)</li>
                <li>Multi-agent routing setup</li>
              </ul>
            </div>
          </div>

          {/* What onboarding configures */}
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-6">What the Wizard Configures</div>
          <div className="space-y-0">
            {[
              { step: '01', title: 'Model & Auth', desc: 'Choose a provider (Anthropic, OpenAI, Google, MiMo, custom), set API key or OAuth, pick a default model.' },
              { step: '02', title: 'Workspace', desc: 'Agent files location (~/.openclaw/workspace). Seeds bootstrap files and SOUL.md.' },
              { step: '03', title: 'Gateway', desc: 'Port, bind address, auth mode, Tailscale exposure. Token auth with optional SecretRef.' },
              { step: '04', title: 'Channels', desc: 'Connect Discord, Telegram, WhatsApp, iMessage, Signal, Slack, Matrix, and more.' },
              { step: '05', title: 'Daemon', desc: 'Installs as a system service — LaunchAgent (macOS), systemd (Linux), or Windows Scheduled Task.' },
              { step: '06', title: 'Health Check', desc: 'Starts the Gateway, verifies it\'s running, and confirms your config is valid.' },
              { step: '07', title: 'Skills', desc: 'Installs recommended skills and optional dependencies. Your agent is ready to use.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 py-4 border-b border-zinc-900 last:border-none">
                <div className="text-orange-500 text-xs font-bold w-6 shrink-0">{s.step}</div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-zinc-300 mb-1">{s.title}</div>
                  <p className="text-zinc-600 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reconfigure */}
          <div className="mt-10 p-6 border border-zinc-800">
            <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-3">Reconfigure Anytime</div>
            <div className="flex flex-wrap gap-3">
              <code className="text-xs text-zinc-300 bg-zinc-950 px-3 py-1.5 border border-zinc-800">openclaw configure</code>
              <code className="text-xs text-zinc-300 bg-zinc-950 px-3 py-1.5 border border-zinc-800">openclaw agents add &lt;name&gt;</code>
              <code className="text-xs text-zinc-300 bg-zinc-950 px-3 py-1.5 border border-zinc-800">openclaw doctor</code>
            </div>
            <p className="text-zinc-600 text-xs mt-3">Re-running onboard does not wipe anything unless you explicitly choose Reset.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-10">By the Numbers</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-900">
            {[
              { stat: '20+', label: 'Channels' },
              { stat: '35+', label: 'Model Providers' },
              { stat: 'MIT', label: 'Licensed' },
              { stat: '5min', label: 'Setup Time' },
            ].map((item) => (
              <div key={item.label} className="bg-black p-6 text-center">
                <div className="text-2xl font-bold text-orange-500">{item.stat}</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mt-2">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter uppercase mb-4">
            Ready to deploy?
          </h2>
          <p className="text-zinc-500 text-sm mb-8 max-w-md mx-auto">
            Run OpenClaw yourself, or let Agentbot handle it in the cloud.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://docs.openclaw.ai/start/getting-started"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] border border-zinc-700 text-zinc-300 px-5 py-2.5 uppercase tracking-widest hover:text-white hover:border-zinc-500 transition-colors"
            >
              Self-Host Guide
            </a>
            <Link
              href="/signup"
              className="text-[11px] bg-white text-black px-5 py-2.5 font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Deploy on Agentbot
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
