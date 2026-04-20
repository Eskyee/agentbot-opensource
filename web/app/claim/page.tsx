'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Coins, Wallet, CheckCircle2, ArrowRight } from 'lucide-react'

type EligibilityResponse = {
  address: string
  eligible: boolean
  alreadyClaimed: boolean
  claim?: {
    tier: string
    credits: number
  } | null
  balance: {
    raw: string
    ui: number
  }
  tier: {
    id: string
    label: string
    credits: number
    minBalance: number
  } | null
  nonce?: string | null
}

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean
      connect: () => Promise<{ publicKey: { toString(): string } }>
      signMessage: (message: Uint8Array, display?: string) => Promise<{ signature: Uint8Array }>
    }
      | undefined
    phantom?: { solana?: Window['solana'] }
    solflare?: Window['solana']
  }
}

function getSolanaProvider() {
  return window.phantom?.solana || window.solana || window.solflare
}

// On iOS Safari and Chrome for Android, Phantom / Solflare browser extensions
// don't exist, so window.phantom / window.solana / window.solflare are never
// injected. Users have to open this page inside the Phantom (or Solflare)
// app's in-app browser, which does inject window.solana. These universal
// links hand off from mobile Safari to the wallet app's browser with this
// page pre-loaded.
function isMobileUserAgent() {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

function phantomBrowseUrl() {
  if (typeof window === 'undefined') return '#'
  const target = window.location.href
  const ref = window.location.host
  return `https://phantom.app/ul/browse/${encodeURIComponent(target)}?ref=${encodeURIComponent(ref)}`
}

function solflareBrowseUrl() {
  if (typeof window === 'undefined') return '#'
  const target = window.location.href
  const ref = window.location.host
  return `https://solflare.com/ul/v1/browse/${encodeURIComponent(target)}?ref=${encodeURIComponent(ref)}`
}

function encodeBase64(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

export default function ClaimPage() {
  const [address, setAddress] = useState('')
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null)
  const [checking, setChecking] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mobile, setMobile] = useState(false)
  const [providerMissing, setProviderMissing] = useState(false)

  useEffect(() => {
    setMobile(isMobileUserAgent())
    // Give extensions a tick to inject, then check. If still missing we'll
    // surface the in-app-browser deeplinks.
    const check = () => setProviderMissing(!getSolanaProvider())
    check()
    const t = window.setTimeout(check, 400)
    return () => window.clearTimeout(t)
  }, [])

  const tierCopy = useMemo(
    () => [
      { label: 'Holder', desc: '1,000+ tokens', credits: 50 },
      { label: 'Builder', desc: '10,000+ tokens', credits: 100 },
      { label: 'Whale', desc: '100,000+ tokens', credits: 200 },
    ],
    []
  )

  async function checkEligibility(targetAddress: string) {
    setChecking(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/claim?address=${encodeURIComponent(targetAddress)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Eligibility check failed')
      setEligibility(data)
    } catch (err) {
      setEligibility(null)
      setError(err instanceof Error ? err.message : 'Eligibility check failed')
    } finally {
      setChecking(false)
    }
  }

  async function connectAndCheck() {
    const provider = getSolanaProvider()
    if (!provider) {
      if (mobile) {
        // Hand off to Phantom's in-app browser, which injects window.solana.
        window.location.href = phantomBrowseUrl()
        return
      }
      setError('Install Phantom or another Solana wallet to claim rewards.')
      return
    }

    try {
      const result = await provider.connect()
      const nextAddress = result.publicKey.toString()
      setAddress(nextAddress)
      await checkEligibility(nextAddress)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet connect rejected')
    }
  }

  async function claim() {
    const provider = getSolanaProvider()
    if (!provider) {
      if (mobile) {
        window.location.href = phantomBrowseUrl()
        return
      }
      setError('Install Phantom or another Solana wallet to claim rewards.')
      return
    }

    setClaiming(true)
    setError(null)
    setSuccess(null)

    let nextAddress: string
    try {
      const result = await provider.connect()
      nextAddress = result.publicKey.toString()
      setAddress(nextAddress)
    } catch (err) {
      setClaiming(false)
      setError(err instanceof Error ? err.message : 'Wallet connect rejected')
      return
    }

    try {
      const eligibilityRes = await fetch(`/api/claim?address=${encodeURIComponent(nextAddress)}&nonce=1`)
      const eligibilityData = await eligibilityRes.json()
      if (!eligibilityRes.ok) throw new Error(eligibilityData.error || 'Eligibility check failed')

      if (!eligibilityData.eligible || !eligibilityData.nonce) {
        throw new Error(eligibilityData.error || 'Wallet is not eligible to claim')
      }

      const message = `Agentbot community rewards claim\nWallet: ${nextAddress}\nNonce: ${eligibilityData.nonce}\nIssued At: ${new Date().toISOString()}`
      const encoded = new TextEncoder().encode(message)
      const signed = await provider.signMessage(encoded, 'utf8')

      const claimRes = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: nextAddress,
          message,
          nonce: eligibilityData.nonce,
          signature: encodeBase64(signed.signature),
        }),
      })

      const claimData = await claimRes.json()
      if (!claimRes.ok) throw new Error(claimData.error || 'Claim failed')

      setEligibility({
        ...eligibilityData,
        eligible: false,
        alreadyClaimed: true,
      })
      setSuccess(`Claim successful — ${claimData.creditsGranted} credits granted.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white font-mono">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-600">Community Rewards</p>
          <h1 className="mt-4 text-4xl font-bold uppercase tracking-tighter md:text-6xl">Claim Your Agentbot Credits</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            Hold the community Solana token, verify your wallet, and unlock credits for the Agentbot platform.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="flex items-start gap-3">
              <Wallet className="mt-1 h-5 w-5 text-blue-400" />
              <div>
                <h2 className="text-lg font-bold uppercase tracking-tight text-white">Verify Solana Wallet</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Connect your Solana wallet, check your live token balance, then sign once to claim credits.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={connectAndCheck}
                disabled={checking || claiming}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-black hover:bg-zinc-200 disabled:opacity-50"
              >
                <Wallet className="h-3.5 w-3.5" />
                {checking ? 'Checking…' : 'Connect Wallet'}
              </button>
              <button
                onClick={claim}
                disabled={!eligibility?.eligible || checking || claiming}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-700 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 hover:border-zinc-500 hover:text-white disabled:opacity-40"
              >
                <Coins className="h-3.5 w-3.5" />
                {claiming ? 'Claiming…' : 'Claim Credits'}
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Connected Address</div>
              <div className="mt-2 break-all text-sm text-blue-300">{address || 'Connect your wallet to begin'}</div>
            </div>

            {mobile && providerMissing && (
              <div className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-blue-300 mb-2">iPhone / Android</div>
                <p className="text-sm leading-6 text-zinc-300 mb-3">
                  Solana wallets don&apos;t inject into mobile Safari. Open this
                  page inside your wallet app&apos;s in-app browser to connect.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <a
                    href={phantomBrowseUrl()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ab9ff2] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black hover:bg-[#9d8fe8]"
                  >
                    Open in Phantom
                    <ArrowRight className="h-3 w-3" />
                  </a>
                  <a
                    href={solflareBrowseUrl()}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-700 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 hover:border-zinc-500 hover:text-white"
                  >
                    Open in Solflare
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {eligibility && (
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Token Balance</div>
                  <div className="mt-2 text-lg font-bold text-white">{eligibility.balance.ui.toLocaleString()}</div>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Tier</div>
                  <div className="mt-2 text-lg font-bold text-white">{eligibility.tier?.label || 'Not eligible'}</div>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Credits</div>
                  <div className="mt-2 text-lg font-bold text-white">{eligibility.tier?.credits || 0}</div>
                </div>
              </div>
            )}

            {error ? <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
            {success ? <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div> : null}
          </div>

          <div className="space-y-4">
            {tierCopy.map((tier) => (
              <div key={tier.label} className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold uppercase text-white">{tier.label}</div>
                  <div className="text-xs font-bold uppercase text-blue-300">{tier.credits} credits</div>
                </div>
                <div className="mt-2 text-sm text-zinc-400">{tier.desc}</div>
              </div>
            ))}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                <div>
                  <div className="text-sm font-bold uppercase text-white">One claim per wallet</div>
                  <div className="mt-2 text-sm leading-6 text-zinc-400">
                    Claims are tied to the verified Solana wallet address, so each holder can claim once.
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/token"
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
            >
              View community token details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

