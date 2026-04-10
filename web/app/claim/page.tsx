'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'

interface TierInfo {
  minBalance: number
  credits: number
  label: string
  current?: boolean
}

interface ClaimResult {
  success?: boolean
  error?: string
  tier?: string
  credits?: number
  balance?: number
  message?: string
  eligible?: boolean
  alreadyClaimed?: boolean
  tiers?: TierInfo[]
  minimumRequired?: number
}

export default function ClaimPage() {
  const [solanaAddress, setSolanaAddress] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<ClaimResult | null>(null)
  const [step, setStep] = useState<'input' | 'verify' | 'claimed'>('input')

  async function checkBalance() {
    if (!solanaAddress) return
    setChecking(true)
    try {
      const res = await fetch(`/api/claim?address=${encodeURIComponent(solanaAddress)}`)
      const data = await res.json()
      setResult(data)

      if (data.alreadyClaimed) {
        setStep('claimed')
      } else if (data.eligible) {
        setStep('verify')
      }
    } catch {
      setResult({ error: 'Failed to check balance' })
    }
    setChecking(false)
  }

  async function claimCredits() {
    if (!solanaAddress || !email) return
    setLoading(true)
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solanaAddress, email }),
      })
      const data = await res.json()
      setResult(data)

      if (data.success) {
        setStep('claimed')
      }
    } catch {
      setResult({ error: 'Claim failed. Try again.' })
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge className="mb-4 bg-green-900/50 text-green-400 border-green-800">
            PHASE 1 — COMMUNITY REWARDS
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight mb-3 font-mono">
            CLAIM FREE AGENT CREDITS
          </h1>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            Hold Solana Agentbot tokens? Claim free credits for agentbot.sh.
            Your tokens, your rewards.
          </p>
        </div>

        {/* Tier Table */}
        <div className="border border-zinc-800 rounded-lg mb-8 overflow-hidden">
          <div className="grid grid-cols-3 text-xs uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
            <div className="p-3">Tier</div>
            <div className="p-3">Min. Tokens</div>
            <div className="p-3">Credits/mo</div>
          </div>
          <div className="grid grid-cols-3 text-sm border-b border-zinc-800 hover:bg-zinc-900/50">
            <div className="p-3 font-mono">🐋 Whale</div>
            <div className="p-3 text-zinc-400">100,000+</div>
            <div className="p-3 text-green-400 font-bold">500</div>
          </div>
          <div className="grid grid-cols-3 text-sm border-b border-zinc-800 hover:bg-zinc-900/50">
            <div className="p-3 font-mono">🔧 Builder</div>
            <div className="p-3 text-zinc-400">10,000+</div>
            <div className="p-3 text-green-400 font-bold">150</div>
          </div>
          <div className="grid grid-cols-3 text-sm hover:bg-zinc-900/50">
            <div className="p-3 font-mono">💎 Holder</div>
            <div className="p-3 text-zinc-400">1,000+</div>
            <div className="p-3 text-green-400 font-bold">50</div>
          </div>
        </div>

        {/* Step 1: Enter Solana Address */}
        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">
                Solana Wallet Address
              </label>
              <Input
                value={solanaAddress}
                onChange={(e) => setSolanaAddress(e.target.value)}
                placeholder="Enter your Solana wallet address"
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
              />
            </div>
            <Button
              onClick={checkBalance}
              disabled={!solanaAddress || checking}
              className="w-full bg-white text-black hover:bg-zinc-200 font-mono uppercase tracking-widest text-xs"
            >
              {checking ? 'Checking...' : 'Check Balance'}
            </Button>

            {result?.error && (
              <div className="p-3 border border-red-900 bg-red-900/20 rounded text-red-400 text-sm">
                {result.error}
                {result.minimumRequired && (
                  <p className="mt-1 text-zinc-500">
                    Minimum: {result.minimumRequired.toLocaleString()} tokens
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Verify & Claim */}
        {step === 'verify' && result?.eligible && (
          <div className="space-y-4">
            <div className="p-4 border border-green-900 bg-green-900/20 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-sm">Your Balance</span>
                <span className="text-white font-mono font-bold">
                  {result.balance?.toLocaleString()} tokens
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Your Tier</span>
                <Badge className="bg-green-900 text-green-400 border-green-700">
                  {result.tier}
                </Badge>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-zinc-400 text-sm">Credits</span>
                <span className="text-green-400 font-bold font-mono">
                  {result.credits}/mo
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">
                Your Email (agentbot.sh account)
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-zinc-900 border-zinc-800 text-white text-sm"
              />
              <p className="text-zinc-600 text-xs mt-1">
                We&apos;ll link credits to this account. New accounts auto-created.
              </p>
            </div>

            <Button
              onClick={claimCredits}
              disabled={!email || loading}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-mono uppercase tracking-widest text-xs"
            >
              {loading ? 'Claiming...' : `Claim ${result.credits} Free Credits`}
            </Button>

            <button
              onClick={() => {
                setStep('input')
                setResult(null)
              }}
              className="w-full text-zinc-600 text-xs hover:text-zinc-400 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Claimed */}
        {step === 'claimed' && (
          <div className="text-center space-y-4">
            <div className="p-6 border border-green-900 bg-green-900/20 rounded">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-xl font-bold text-white mb-2">
                {result?.alreadyClaimed ? 'Already Claimed' : 'Credits Claimed!'}
              </h2>
              <p className="text-zinc-400 text-sm">
                {result?.message ||
                  `${result?.credits} credits have been added to your account.`}
              </p>
            </div>

            <a
              href="/dashboard"
              className="inline-block bg-white text-black px-6 py-3 rounded font-mono text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Go to Dashboard →
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-zinc-900 text-center">
          <p className="text-zinc-600 text-xs">
            Solana token:{' '}
            <code className="text-zinc-500">
              9V4m199eohMgy7bB7MbXhDacUur6NzpgZVrhfux5pump
            </code>
          </p>
          <p className="text-zinc-700 text-xs mt-2">
            Only verified holders can claim. One claim per wallet.
          </p>
        </div>
      </div>
    </main>
  )
}
