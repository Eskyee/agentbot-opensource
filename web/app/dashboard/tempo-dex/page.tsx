'use client'

import { useState } from 'react'
import { ArrowDownUp, RefreshCw, Settings, Info } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

const TOKENS = [
  { symbol: 'pathUSD', name: 'Path USD', icon: '💵', address: '0x20c0000000000000000000000000000000000000' },
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠', address: '0x0000000000000000000000000000000000000000' },
]

export default function TempoDexPage() {
  const [fromToken, setFromToken] = useState(TOKENS[0])
  const [toToken, setToToken] = useState(TOKENS[1])
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [swapping, setSwapping] = useState(false)

  const flipTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return
    setSwapping(true)
    // Simulate swap
    await new Promise(r => setTimeout(r, 2000))
    setToAmount((parseFloat(fromAmount) * 0.997).toFixed(6))
    setSwapping(false)
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Tempo DEX"
        icon={<ArrowDownUp className="h-5 w-5 text-orange-500" />}
        action={
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 font-mono">Chain 4217</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded px-2 py-0.5 font-mono">LIVE</span>
          </div>
        }
      />

      <DashboardContent className="max-w-md mx-auto">
        <div className="border border-zinc-800 bg-zinc-950 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Swap</div>
            <button className="p-1.5 text-zinc-500 hover:text-white">
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {/* From */}
          <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-4 mb-2 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-zinc-500 uppercase">From</span>
              <span className="text-[10px] text-zinc-600">Balance: 0.00</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={fromAmount}
                onChange={e => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 min-w-0 bg-transparent text-2xl font-bold text-white outline-none placeholder:text-zinc-700"
              />
              <button className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white flex-shrink-0">
                <span>{fromToken.icon}</span>
                <span className="font-bold">{fromToken.symbol}</span>
              </button>
            </div>
          </div>

          {/* Flip */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={flipTokens}
              className="bg-zinc-800 border border-zinc-700 rounded-full p-2 hover:border-zinc-500 transition-colors"
            >
              <ArrowDownUp className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          {/* To */}
          <div className="border border-zinc-800 bg-zinc-900 rounded-lg p-4 mt-2 mb-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-zinc-500 uppercase">To</span>
              <span className="text-[10px] text-zinc-600">Balance: 0.00</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={toAmount}
                readOnly
                placeholder="0.00"
                className="flex-1 min-w-0 bg-transparent text-2xl font-bold text-white outline-none placeholder:text-zinc-700"
              />
              <button className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white flex-shrink-0">
                <span>{toToken.icon}</span>
                <span className="font-bold">{toToken.symbol}</span>
              </button>
            </div>
          </div>

          {/* Swap button */}
          <button
            onClick={handleSwap}
            disabled={swapping || !fromAmount}
            className="w-full bg-red-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 rounded-lg transition-colors text-sm uppercase tracking-widest"
          >
            {swapping ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Swapping...
              </span>
            ) : (
              'Swap'
            )}
          </button>

          {/* Info */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>Rate</span>
              <span>1 {fromToken.symbol} ≈ 0.997 {toToken.symbol}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
              <span>Fee</span>
              <span>0.3%</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
              <span>Network</span>
              <span>Tempo (Chain 4217)</span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-[10px] text-zinc-600">
          <Info className="h-3 w-3 inline mr-1" />
          Tempo DEX — swap tokens on the Tempo network. Powered by x402.
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
