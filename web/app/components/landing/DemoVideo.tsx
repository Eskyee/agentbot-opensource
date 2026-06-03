'use client'

import { useState } from 'react'

const DEMO_MESSAGES = [
  { role: 'user', content: 'Monitor mentions of @baseFM on X and draft replies.' },
  { role: 'agent', content: 'On it. I\'ve set up monitoring for @baseFM mentions. I\'ll draft replies for your approval before anything goes live. Currently tracking 3 new mentions in the last hour.' },
  { role: 'user', content: 'What\'s on my calendar tomorrow?' },
  { role: 'agent', content: 'You have 3 events tomorrow:\n• 10:00 — Team standup (Google Meet)\n• 14:00 — Client call with Salted Roots\n• 19:00 — baseFM live stream (B2B with DJ Koji)\n\nI\'ve prepared briefing notes for the client call. Want me to send them?' },
  { role: 'user', content: 'Yes, and draft a tweet about tonight\'s stream.' },
  { role: 'agent', content: '✅ Briefing notes sent to your email.\n\nHere\'s the draft tweet:\n\n"🎧 Tonight 7pm GMT — baseFM B2B session. Two selectors, one stream, zero human intervention. Pure signal. #baseFM #Jungle #AutonomousRadio"\n\nApprove to post?' },
  { role: 'user', content: 'Approve.' },
  { role: 'agent', content: '✅ Posted. 12 impressions in the first minute.\n\nAlso: I noticed your Stripe invoice for Salted Roots (£450) is overdue by 3 days. Want me to send a follow-up?' },
]

export function DemoVideo() {
  const [visibleMessages, setVisibleMessages] = useState(0)
  const [playing, setPlaying] = useState(false)

  const startDemo = () => {
    setPlaying(true)
    setVisibleMessages(1)
    let i = 1
    const interval = setInterval(() => {
      i++
      if (i > DEMO_MESSAGES.length) {
        clearInterval(interval)
        return
      }
      setVisibleMessages(i)
    }, 1800)
  }

  return (
    <section className="border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="max-w-2xl mb-10 sm:mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">See It In Action</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
            60 Seconds<br />
            <span className="text-zinc-700">From Zero to Live</span>
          </h2>
          <p className="text-zinc-500 text-sm mt-4 max-w-md">
            Watch a real conversation with an Agentbot agent. Monitoring X, managing calendar, drafting posts, handling invoices — all autonomous, all approved by you.
          </p>
        </div>

        {/* Interactive demo terminal */}
        <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">
          {/* Terminal chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-zinc-800 rounded px-3 py-1 text-[10px] text-zinc-500 font-mono text-center">
                agentbot.sh/demo — live conversation
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 sm:p-6 min-h-[400px] max-h-[500px] overflow-y-auto space-y-4">
            {!playing ? (
              <div className="flex flex-col items-center justify-center h-[350px] gap-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="text-lg font-bold uppercase tracking-tighter mb-2">Interactive Demo</h3>
                  <p className="text-zinc-500 text-sm max-w-sm">
                    See how Agentbot handles real tasks — X monitoring, calendar management, content drafting, and invoice tracking.
                  </p>
                </div>
                <button
                  onClick={startDemo}
                  className="bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Start Demo
                </button>
              </div>
            ) : (
              <>
                {DEMO_MESSAGES.slice(0, visibleMessages).map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-zinc-800 text-white border border-zinc-700'
                          : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                      }`}
                    >
                      <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">
                        {msg.role === 'user' ? 'You' : 'Agent'}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {visibleMessages >= DEMO_MESSAGES.length && (
                  <div className="text-center pt-6">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Demo Complete</div>
                    <p className="text-zinc-500 text-xs mb-4">
                      This is a real conversation flow. Your agent does all of this — 24/7, on autopilot, with your approval.
                    </p>
                    <a
                      href="/signup"
                      className="inline-flex items-center justify-center bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                    >
                      Deploy Your Agent →
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
