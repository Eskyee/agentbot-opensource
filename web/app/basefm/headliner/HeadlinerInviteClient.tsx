'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type InviteStatus = 'idle' | 'loading' | 'valid' | 'invalid' | 'expired'

interface InviteDetails {
  audience?: string
  email?: string | null
  plan?: string
}

const setupSteps = [
  {
    label: 'Connect or sign in',
    body: 'Use the invited account so Agentbot can keep your DJ controls available after reloads.',
  },
  {
    label: 'Redeem invite',
    body: 'Your headliner code unlocks the baseFM streaming flow before you open the broadcast rack.',
  },
  {
    label: 'Open DJ stream panel',
    body: 'The panel creates your set, shows remaining time, and keeps controls visible while you are live.',
  },
  {
    label: 'Start OBS',
    body: 'Copy the RTMP URL and stream key into OBS, then wait for the panel to show live status.',
  },
]

const broadcastNotes = [
  'Audio-only is the default if you make no broadcast-mode choice.',
  'Video is optional for DJs who want camera, artwork, or a visual bed.',
  'Set time, countdown, stream key, and OBS setup appear after access is confirmed.',
  'If a key goes stale, end the old set and create a fresh stream from the panel.',
]

export default function HeadlinerInviteClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<InviteStatus>(token ? 'loading' : 'idle')
  const [details, setDetails] = useState<InviteDetails | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('idle')
      setDetails(null)
      return
    }

    let cancelled = false
    setStatus('loading')

    fetch('/api/invites/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const data = await response.json()
        if (cancelled) return

        if (response.ok && data.valid) {
          setDetails({
            audience: data.audience,
            email: data.email,
            plan: data.plan,
          })
          setStatus('valid')
          return
        }

        setStatus(response.status === 410 ? 'expired' : 'invalid')
      })
      .catch(() => {
        if (!cancelled) setStatus('invalid')
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const redeemHref = useMemo(() => {
    return token ? `/invite?token=${encodeURIComponent(token)}` : '/login'
  }, [token])

  const statusLabel = {
    idle: 'Invite Required',
    loading: 'Checking Invite',
    valid: 'Headliner Invite Ready',
    invalid: 'Invite Not Valid',
    expired: 'Invite Expired',
  }[status]

  return (
    <main className="min-h-screen bg-black text-white selection:bg-red-500/30 font-mono">
      <section className="border-b border-zinc-900">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="border border-red-500/40 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-500">
                baseFM Headliner
              </span>
              <span className="border border-zinc-800 px-3 py-1 text-[10px] uppercase tracking-widest text-zinc-500">
                {statusLabel}
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl font-bold uppercase leading-[0.92] tracking-tighter sm:text-6xl md:text-7xl">
              You have been invited as a baseFM headliner.
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-zinc-400">
              Redeem your invite, sign in or connect, then open the Agentbot DJ stream panel. Your normal Pioneer,
              Rekordbox, mixer, and OBS workflow stays the same. Agentbot handles the broadcast rack.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={redeemHref}
                className="inline-flex items-center justify-center bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200"
              >
                {token ? 'Redeem Invite' : 'Sign In'}
              </Link>
              <Link
                href="/dashboard/dj-stream"
                className="inline-flex items-center justify-center border border-red-500/40 px-6 py-3 text-xs font-bold uppercase tracking-widest text-red-500 transition-colors hover:border-red-400 hover:text-red-400"
              >
                Open DJ Stream Panel
              </Link>
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950/40 p-5">
            <div className="mb-4 text-[10px] uppercase tracking-widest text-zinc-600">Invite Status</div>
            {status === 'loading' ? (
              <p className="text-sm text-zinc-400">Checking your invite code...</p>
            ) : status === 'valid' ? (
              <div className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-widest text-green-400">Ready for headliner access</p>
                {details?.email ? <p className="text-xs text-zinc-500">Issued to: <span className="text-zinc-300">{details.email}</span></p> : null}
                <p className="text-xs text-zinc-500">Audience: <span className="text-zinc-300 uppercase">{details?.audience || 'headliner'}</span></p>
              </div>
            ) : status === 'expired' ? (
              <p className="text-sm text-red-400">This invite has expired. Ask an admin to issue a fresh headliner invite.</p>
            ) : status === 'invalid' ? (
              <p className="text-sm text-red-300">This invite link is not valid. Check the URL or ask an admin for a new code.</p>
            ) : (
              <p className="text-sm text-zinc-400">Open this page from the invite link sent by the baseFM team.</p>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-900">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16">
          <div className="mb-8 max-w-2xl">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Headliner Flow</div>
            <h2 className="text-2xl font-bold uppercase tracking-tighter sm:text-3xl">From invite to live set.</h2>
          </div>
          <div className="grid gap-px bg-zinc-900 sm:grid-cols-2 lg:grid-cols-4">
            {setupSteps.map((step, index) => (
              <div key={step.label} className="bg-black p-5">
                <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-red-500">Step {index + 1}</div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-white">{step.label}</h3>
                <p className="text-xs leading-relaxed text-zinc-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-6 sm:py-16 lg:grid-cols-2">
          <div className="border border-zinc-800 bg-black p-5">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">Broadcast Defaults</div>
            <h2 className="mb-5 text-2xl font-bold uppercase tracking-tighter">Audio first. Video when needed.</h2>
            <div className="space-y-3">
              {broadcastNotes.map((note) => (
                <p key={note} className="border border-zinc-900 bg-zinc-950/40 p-3 text-xs leading-relaxed text-zinc-400">
                  {note}
                </p>
              ))}
            </div>
          </div>

          <div className="border border-zinc-800 bg-black p-5">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">After Access</div>
            <h2 className="mb-5 text-2xl font-bold uppercase tracking-tighter">What the panel gives you.</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Set title and city', 'Remaining set countdown', 'RTMP URL copy button', 'Stream key copy button', 'OBS setup checklist', 'Audio and video commands'].map((item) => (
                <div key={item} className="border border-zinc-900 bg-zinc-950/40 p-3 text-xs uppercase tracking-widest text-zinc-400">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
