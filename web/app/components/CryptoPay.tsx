'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { base } from 'viem/chains'
import { formatUnits, parseUnits } from 'viem'

const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDC_DECIMALS = 6
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
]

interface CryptoPayProps {
  amount: number // USD amount
  onSuccess?: (txHash: string) => void
  onError?: (error: string) => void
}

export function CryptoPay({ amount, onSuccess, onError }: CryptoPayProps) {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending: connecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContractAsync, isPending: sending } = useWriteContract()

  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'confirming' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null)

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
    chainId: base.id,
  })

  // Fetch USDC balance
  useEffect(() => {
    if (!address) return
    setUsdcBalance(null)
    fetch(`https://mainnet.base.org`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: BASE_USDC_ADDRESS,
            data: `0x70a08231000000000000000000000000${address.slice(2).toLowerCase()}`,
          },
          'latest',
        ],
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.result) {
          const bal = BigInt(d.result)
          setUsdcBalance(formatUnits(bal, USDC_DECIMALS))
        }
      })
      .catch(() => setUsdcBalance(null))
  }, [address, txHash])

  // Handle confirmation
  useEffect(() => {
    if (receipt?.status === 'success' && status === 'confirming') {
      setStatus('done')
      onSuccess?.(receipt.transactionHash)
    }
  }, [receipt, status, onSuccess])

  async function handlePay() {
    if (!address || !isConnected) return

    // Ensure Base chain
    if (chain?.id !== base.id) {
      try {
        await (window as any).ethereum?.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${base.id.toString(16)}` }],
        })
      } catch {
        setErrorMsg('Please switch to Base network')
        setStatus('error')
        return
      }
    }

    setStatus('sending')
    setErrorMsg(null)

    try {
      const recipient = process.env.NEXT_PUBLIC_CREDIT_RECIPIENT || address // fallback to self for testing
      const usdcAmount = parseUnits(amount.toFixed(2), USDC_DECIMALS)

      const hash = await writeContractAsync({
        address: BASE_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [recipient, usdcAmount],
        chainId: base.id,
      })

      setTxHash(hash)
      setStatus('confirming')
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || 'Transaction failed'
      setErrorMsg(msg)
      setStatus('error')
      onError?.(msg)
    }
  }

  if (!isConnected) {
    return (
      <div className="space-y-3">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Pay with Crypto · USDC on Base</div>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={connecting}
            className="w-full border border-zinc-800 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-50"
          >
            {connecting ? 'Connecting…' : `Connect ${connector.name}`}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Pay with Crypto · USDC on Base</div>

      {/* Connected wallet info */}
      <div className="flex items-center justify-between py-2 border-b border-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-zinc-400 font-mono">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
        </div>
        <div className="flex items-center gap-3">
          {usdcBalance !== null && (
            <span className="text-xs text-zinc-500 font-mono tabular-nums">${parseFloat(usdcBalance).toFixed(2)} USDC</span>
          )}
          <button onClick={() => disconnect()} className="text-[9px] text-zinc-600 hover:text-white uppercase tracking-widest">
            disconnect
          </button>
        </div>
      </div>

      {/* Payment amount */}
      <div className="border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">Amount</span>
          <span className="text-lg font-bold tracking-tighter">${amount.toFixed(2)} <span className="text-xs font-normal text-zinc-600">USDC</span></span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">Network</span>
          <span className="text-xs text-zinc-400">Base</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">Token</span>
          <span className="text-xs text-zinc-400">USDC · 0x8335…2913</span>
        </div>
      </div>

      {/* Pay button */}
      {status === 'idle' && (
        <button
          onClick={handlePay}
          disabled={sending}
          className="w-full bg-white text-black py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {sending ? 'Confirm in wallet…' : `Pay $${amount.toFixed(2)} USDC`}
        </button>
      )}

      {/* Status messages */}
      {status === 'sending' && (
        <div className="text-xs text-zinc-400 text-center animate-pulse">Confirm the transaction in your wallet…</div>
      )}
      {status === 'confirming' && txHash && (
        <div className="text-xs text-orange-500 text-center">
          Confirming…
          <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
            view tx
          </a>
        </div>
      )}
      {status === 'done' && txHash && (
        <div className="text-xs text-green-500 text-center">
          ✓ Payment confirmed
          <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
            view tx
          </a>
        </div>
      )}
      {status === 'error' && errorMsg && (
        <div className="text-xs text-red-400 text-center">{errorMsg}</div>
      )}
    </div>
  )
}
