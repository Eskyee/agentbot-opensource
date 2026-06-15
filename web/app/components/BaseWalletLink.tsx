'use client'

/**
 * BaseWalletLink — link your Base wallet once, confirm ownership by QR.
 *
 * Shows the linked address if present (with a Disconnect control), or the
 * Sign in with Base flow (scannable QR) to link it. Reused in Settings and
 * anywhere a "connect your Base wallet" prompt is needed. After linking, every
 * surface reads the address via useLinkedBaseWallet — no repeat connects.
 */
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useLinkedBaseWallet } from '@/app/hooks/useLinkedBaseWallet'

const SignInWithBase = dynamic(() => import('@/app/components/SignInWithBase'), { ssr: false })

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function BaseWalletLink({ callbackUrl = '/settings?tab=wallet' }: { callbackUrl?: string }) {
  const { address, loading, refresh } = useLinkedBaseWallet()
  const [unlinking, setUnlinking] = useState(false)
  const [copied, setCopied] = useState(false)

  async function unlink() {
    setUnlinking(true)
    try {
      await fetch('/api/wallet/base-link', { method: 'DELETE' })
      await refresh()
    } finally {
      setUnlinking(false)
    }
  }

  if (loading) {
    return <div className="h-10 w-40 animate-pulse rounded bg-zinc-900" />
  }

  if (address) {
    return (
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[10px] uppercase tracking-widest text-green-400">Base wallet linked</span>
          </div>
          <button
            onClick={unlink}
            disabled={unlinking}
            className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-red-400 disabled:opacity-50"
          >
            {unlinking ? 'Removing…' : 'Disconnect'}
          </button>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(address).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1200)
            })
          }}
          className="mt-3 font-mono text-sm text-white hover:text-orange-400"
          title="Copy address"
        >
          {shorten(address)} {copied ? '· copied' : ''}
        </button>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Used everywhere — DJ streaming, receive addresses, and transfers. You won&apos;t be asked
          to connect again unless you disconnect here.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-[10px] uppercase tracking-widest text-zinc-600">Base wallet</p>
      <p className="mt-2 text-sm text-zinc-400">
        Link your Base wallet once. Scan the QR to confirm ownership — after that it&apos;s used
        across the whole platform with no repeat sign-ins.
      </p>
      <div className="mt-4 max-w-sm">
        <SignInWithBase callbackUrl={callbackUrl} />
      </div>
    </div>
  )
}
