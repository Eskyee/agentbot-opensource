'use client'

import { useState } from 'react'

interface Channel {
  id: string
  name: string
  icon: string
  description: string
  steps: string[]
  connectUrl?: string
  status: 'connected' | 'disconnected' | 'coming-soon'
}

const channels: Channel[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    description: 'Message your agent directly in Telegram. Fastest setup — under 2 minutes.',
    steps: [
      'Open Telegram and search for @AgentbotRBot',
      'Send /start to connect your agent',
      'Your agent will verify your account and go live',
    ],
    connectUrl: 'https://t.me/AgentbotRBot',
    status: 'disconnected',
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: '🎮',
    description: 'Add your agent to any Discord server. Works in DMs and server channels.',
    steps: [
      'Click "Add to Discord" and select your server',
      'Grant the bot permissions it requests',
      'Your agent will introduce itself in the server',
    ],
    connectUrl: '/api/discord/invite',
    status: 'disconnected',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '💬',
    description: 'Reach your agent on WhatsApp. Most familiar interface for clients.',
    steps: [
      'Click "Connect WhatsApp" to start the pairing',
      'Scan the QR code from your WhatsApp app',
      'Your agent is now reachable via WhatsApp',
    ],
    status: 'disconnected',
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '💼',
    description: 'Bring your agent into your Slack workspace. Perfect for teams.',
    steps: [
      'Click "Add to Slack" and choose your workspace',
      'Authorize the app in your Slack settings',
      'Mention your agent in any channel to get started',
    ],
    status: 'coming-soon',
  },
  {
    id: 'webchat',
    name: 'Web Chat',
    icon: '🌐',
    description: 'Embed a chat widget on your own website. No app required.',
    steps: [
      'Copy your unique chat widget code from Settings',
      'Paste it into your website HTML',
      'Visitors can now chat with your agent directly',
    ],
    status: 'connected',
  },
]

function StatusBadge({ status }: { status: Channel['status'] }) {
  const styles: Record<string, string> = {
    connected: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    disconnected: 'border-zinc-700 bg-zinc-900 text-zinc-400',
    'coming-soon': 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  }
  const labels: Record<string, string> = {
    connected: 'Connected',
    disconnected: 'Not Connected',
    'coming-soon': 'Coming Soon',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${styles[status]}`}>
      {status === 'connected' && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
      {labels[status]}
    </span>
  )
}

export default function ChannelsPage() {
  const [expandedId, setExpandedId] = useState<string | null>('telegram')

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 block">Settings</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-4">Connect Your Agent</h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            Your agent lives in the cloud. Bring it to where you already message. Pick a channel, connect in minutes, and start chatting — no dashboard required.
          </p>
        </div>

        {/* Channels */}
        <div className="space-y-3">
          {channels.map((channel) => {
            const isExpanded = expandedId === channel.id
            const canConnect = channel.status !== 'coming-soon'

            return (
              <div
                key={channel.id}
                className={`border transition-colors ${
                  isExpanded ? 'border-zinc-600' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : channel.id)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{channel.icon}</span>
                    <div>
                      <div className="text-sm font-bold uppercase tracking-wider">{channel.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{channel.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={channel.status} />
                    <svg
                      className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 px-6 py-6">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Setup Steps</div>
                    <div className="space-y-3 mb-6">
                      {channel.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-4">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-[10px] font-bold text-zinc-400">
                            {i + 1}
                          </div>
                          <div className="text-sm text-zinc-300 pt-0.5">{step}</div>
                        </div>
                      ))}
                    </div>

                    {canConnect && channel.status === 'disconnected' && channel.connectUrl && (
                      <a
                        href={channel.connectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                      >
                        Connect {channel.name} →
                      </a>
                    )}

                    {channel.status === 'connected' && (
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-xs text-emerald-300 uppercase tracking-wider">Active — your agent is listening</span>
                      </div>
                    )}

                    {channel.status === 'coming-soon' && (
                      <div className="text-xs text-zinc-500 uppercase tracking-wider">Launching soon — stay tuned</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Help */}
        <div className="mt-12 border border-zinc-800 p-6">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Need Help?</div>
          <p className="text-sm text-zinc-400 mb-4">
            If your agent isn&apos;t responding after connecting, go to your dashboard and click &quot;Restart Agent.&quot; Wait for it to restart, then message again.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
          >
            Back to Dashboard →
          </a>
        </div>
      </div>
    </main>
  )
}
