'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { Copy, ExternalLink, Send, Wallet } from 'lucide-react'
import { useAccount, useConnect, useDisconnect, usePublicClient, useSendTransaction, useSwitchChain, useWriteContract } from 'wagmi'
import { base } from 'wagmi/chains'
import { erc20Abi, isAddress, parseEther, parseUnits, type Address } from 'viem'
import { useCustomSession } from '@/app/lib/useCustomSession'
import { BASE_USDC_ADDRESS } from '@/app/lib/base-wallet'
import { setSessionId, clearSessionId } from '@/lib/mpp/session-fetch'
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'
import StatusPill from '@/app/components/shared/StatusPill'
import SignInWithBase from '@/app/components/SignInWithBase'

type WalletAsset = {
  address: string
  name: string
  symbol: string
  decimals: number
  balance: string
  balanceRaw: string
  explorerUrl: string
}

type WalletData = {
  address: string
  chain: string
  chainId: number
  explorerUrl: string
  nativeBalance: WalletAsset
  primaryToken: WalletAsset
  assets: WalletAsset[]
  allTokens: WalletAsset[]
}

type WalletAddressResponse = {
  authenticated: boolean
  address: string | null
  network?: string
  type?: string
  source?: string
  message?: string
}

type WalletTransaction = {
  hash: string
  direction: 'sent' | 'received'
  symbol: 'USDC'
  amount: string
  amountRaw: string
  from: string
  to: string
  blockNumber: string
  timestamp: string
  status: 'confirmed'
  explorerUrl: string
}

type TransactionsResponse = {
  transactions: WalletTransaction[]
}

type Session = {
  id: string
  userAddress: string
  deposit: string
  spent: string
  remaining: string
  vouchers: unknown[]
  status: 'active' | 'settling' | 'closed'
  createdAt: number
}

const TOP_UP_OPTIONS = [5, 10, 25, 50] as const

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatAmount(value: string, maxDigits = 4) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return value
  return parsed.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits,
  })
}

export default function WalletPage() {
  const { status } = useCustomSession()
  const { address: connectedAddress, isConnected, chainId } = useAccount()
  const { connectAsync, connectors, isPending: walletConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChainAsync, isPending: switchingChain } = useSwitchChain()
  const { sendTransactionAsync, isPending: sendingNative } = useSendTransaction()
  const { writeContractAsync, isPending: sendingToken } = useWriteContract()
  const publicClient = usePublicClient({ chainId: base.id })

  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletMeta, setWalletMeta] = useState<WalletAddressResponse | null>(null)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sendAsset, setSendAsset] = useState<'USDC' | 'ETH'>('USDC')
  const [sendRecipient, setSendRecipient] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendHash, setSendHash] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [mppSession, setMppSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [topUpLoading, setTopUpLoading] = useState<number | null>(null)

  const effectiveAddress = walletAddress ?? connectedAddress ?? null
  const preferredConnector = useMemo(
    () => connectors.find((connector) => connector.id === 'coinbaseWalletSDK') ?? connectors[0],
    [connectors]
  )
  const sendPending = sendingNative || sendingToken || switchingChain

  const loadWalletState = useCallback(async (addressOverride?: string | null) => {
    const targetAddress = addressOverride ?? effectiveAddress
    if (!targetAddress) {
      setWallet(null)
      setTransactions([])
      setMppSession(null)
      return
    }

    setLoadingTransactions(true)

    const [walletRes, txRes, sessionRes] = await Promise.all([
      fetch(`/api/wallet?address=${targetAddress}`).then((res) => res.json()).catch(() => null),
      fetch(`/api/wallet/transactions?address=${targetAddress}`).then((res) => res.json()).catch(() => null),
      fetch(`/api/wallet/sessions?address=${targetAddress}`).then((res) => res.json()).catch(() => null),
    ])

    startTransition(() => {
      if (walletRes && !walletRes.error) setWallet(walletRes)
      if (txRes && !txRes.error) setTransactions((txRes as TransactionsResponse).transactions || [])
      if (sessionRes?.sessions?.length > 0) {
        const active = sessionRes.sessions.find((item: Session) => item.status === 'active')
        if (active) {
          setMppSession(active)
          setSessionId(active.id)
        } else {
          setMppSession(null)
          clearSessionId()
        }
      } else {
        setMppSession(null)
        clearSessionId()
      }
      setLoadingTransactions(false)
    })
  }, [effectiveAddress])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const addressRes = await fetch('/api/wallet/address')
        const addressData = await addressRes.json()
        if (cancelled) return

        setWalletMeta(addressData)
        if (addressData.address) {
          setWalletAddress(addressData.address)
          await loadWalletState(addressData.address)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [loadWalletState])

  useEffect(() => {
    if (!walletAddress && connectedAddress) {
      void loadWalletState(connectedAddress)
    }
  }, [connectedAddress, loadWalletState, walletAddress])

  async function connectWallet() {
    if (!preferredConnector) {
      setSendError('No Base wallet connector is available.')
      return
    }

    setSendError(null)
    await connectAsync({ connector: preferredConnector, chainId: base.id })
  }

  async function ensureConnectedSender() {
    if (!isConnected) {
      await connectWallet()
    }

    const sender = connectedAddress ?? walletAddress
    if (!sender || !isAddress(sender)) {
      throw new Error('Connect your Base wallet before sending funds.')
    }

    if (walletAddress && sender.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('Reconnect the same Base wallet you used to sign in before sending funds.')
    }

    if (chainId !== base.id) {
      await switchChainAsync({ chainId: base.id })
    }

    return sender as Address
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSendError(null)
    setSendHash(null)

    if (!isAddress(sendRecipient)) {
      setSendError('Enter a valid Base address.')
      return
    }

    if (!sendAmount || Number(sendAmount) <= 0) {
      setSendError('Enter a valid amount greater than zero.')
      return
    }

    if (!publicClient) {
      setSendError('Base public client is unavailable.')
      return
    }

    try {
      const sender = await ensureConnectedSender()
      const recipient = sendRecipient as Address
      let hash: `0x${string}`

      if (sendAsset === 'ETH') {
        hash = await sendTransactionAsync({
          account: sender,
          to: recipient,
          value: parseEther(sendAmount),
          chainId: base.id,
        })
      } else {
        hash = await writeContractAsync({
          account: sender,
          chainId: base.id,
          address: BASE_USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [recipient, parseUnits(sendAmount, 6)],
        })
      }

      await publicClient.waitForTransactionReceipt({ hash })
      setSendHash(hash)
      setSendAmount('')
      await loadWalletState(sender)
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Transfer failed')
    }
  }

  async function openSession() {
    if (!effectiveAddress) return
    setSessionLoading(true)
    try {
      const res = await fetch('/api/wallet/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: effectiveAddress, deposit: '10.00' }),
      })
      const data = await res.json()
      if (data.session) {
        setMppSession(data.session)
        setSessionId(data.session.id)
      }
    } catch (error) {
      console.error('Open session error:', error)
    } finally {
      setSessionLoading(false)
    }
  }

  async function closeMppSession() {
    if (!mppSession) return
    setSessionLoading(true)
    try {
      const res = await fetch(`/api/wallet/sessions?sessionId=${mppSession.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setMppSession(null)
        clearSessionId()
      }
    } catch (error) {
      console.error('Close session error:', error)
    } finally {
      setSessionLoading(false)
    }
  }

  async function handleTopUp(amount: number) {
    if (!effectiveAddress || topUpLoading) return
    setTopUpLoading(amount)
    try {
      const res = await fetch(`/api/wallet/top-up?amount=${amount * 100}&address=${effectiveAddress}`)
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        setSendError(data.error)
      }
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Top-up failed')
    } finally {
      setTopUpLoading(null)
    }
  }

  const needsWalletReconnect = walletAddress && connectedAddress && walletAddress.toLowerCase() !== connectedAddress.toLowerCase()

  return (
    <DashboardShell>
      <DashboardHeader title="Wallet" icon={<Wallet className="h-5 w-5 text-blue-400" />} />
      <DashboardContent>
        <div className="max-w-5xl space-y-6">
          {!loading && !effectiveAddress && (
            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <p className="text-[10px] uppercase tracking-widest text-zinc-600">Base Wallet</p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-white">Sign in with Base to unlock send and receive</h2>
              <p className="mt-3 max-w-xl text-sm text-zinc-400">
                Your main wallet rail is Base. Sign in with the wallet you want to use for receive addresses,
                top-ups, and direct transfers. Tempo payment sessions stay available below as a separate agent-spend rail.
              </p>
              {status === 'unauthenticated' ? (
                <div className="mt-6 max-w-sm">
                  <SignInWithBase callbackUrl="/dashboard/wallet" />
                </div>
              ) : (
                <div className="mt-6">
                  <button
                    onClick={() => void connectWallet()}
                    disabled={walletConnecting}
                    className="border border-zinc-700 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:border-zinc-500 disabled:opacity-50"
                  >
                    {walletConnecting ? 'Connecting...' : 'Connect Base Wallet'}
                  </button>
                </div>
              )}
            </div>
          )}

          {effectiveAddress && (
            <>
              <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
                <div className="border border-zinc-800 bg-zinc-950 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-600">Base Mainnet</p>
                      <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                        {wallet ? `${formatAmount(wallet.primaryToken.balance, 2)} USDC` : 'Loading...'}
                      </h2>
                      <p className="mt-2 text-sm text-zinc-400">
                        {wallet ? `${formatAmount(wallet.nativeBalance.balance)} ETH available for gas` : 'Fetching balances...'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status="active" label="Base" size="sm" />
                      {isConnected ? (
                        <button
                          onClick={() => disconnect()}
                          className="text-[10px] uppercase tracking-widest text-zinc-600 transition-colors hover:text-red-400"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => void connectWallet()}
                          disabled={walletConnecting}
                          className="text-[10px] uppercase tracking-widest text-zinc-600 transition-colors hover:text-white disabled:opacity-50"
                        >
                          {walletConnecting ? 'Connecting...' : 'Reconnect'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-px bg-zinc-800 sm:grid-cols-2">
                    <div className="bg-zinc-950 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-600">Wallet address</p>
                      <div className="mt-2 flex items-center gap-2 text-sm text-zinc-200">
                        <span className="font-mono">{formatAddress(effectiveAddress)}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(effectiveAddress)
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                          }}
                          className="text-zinc-500 transition-colors hover:text-white"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      {copied && <p className="mt-2 text-xs text-emerald-400">Address copied.</p>}
                    </div>
                    <div className="bg-zinc-950 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-600">Explorer</p>
                      <a
                        href={wallet?.explorerUrl || `https://basescan.org/address/${effectiveAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm text-zinc-200 transition-colors hover:text-white"
                      >
                        View on Basescan <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  {wallet?.assets?.length ? (
                    <div className="mt-6 border-t border-zinc-800 pt-4">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-600">Assets</p>
                      <div className="mt-3 space-y-3">
                        {wallet.assets.map((asset) => (
                          <div key={asset.address} className="flex items-center justify-between text-sm">
                            <div>
                              <p className="font-medium text-white">{asset.symbol}</p>
                              <p className="text-xs text-zinc-500">{asset.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-zinc-200">{formatAmount(asset.balance)}</p>
                              <a
                                href={asset.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-300"
                              >
                                Explorer
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-6">
                  <div className="border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600">Receive</p>
                    <h3 className="mt-2 text-lg font-bold text-white">Fund this Base wallet</h3>
                    <p className="mt-3 text-sm text-zinc-400">
                      Use this address for inbound USDC or ETH on Base. If you want to buy with card, open Coinbase Onramp directly into this address.
                    </p>
                    <div className="mt-4 border border-zinc-800 bg-black p-4 font-mono text-xs text-zinc-300 break-all">
                      {effectiveAddress}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(effectiveAddress)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="border border-zinc-700 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:border-zinc-500"
                      >
                        Copy address
                      </button>
                      <a
                        href={`https://onramp.coinbase.com/buy?preset=base&defaultFlow=wallet&walletAddress=${effectiveAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-zinc-700 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:border-zinc-500"
                      >
                        Buy on Base
                      </a>
                    </div>
                  </div>

                  <div className="border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600">Send</p>
                    <h3 className="mt-2 text-lg font-bold text-white">Send from your Base wallet</h3>
                    <p className="mt-3 text-sm text-zinc-400">
                      Connect the same Base wallet you used to sign in. USDC transfers are sent on Base mainnet, and ETH sends remain available for gas transfers.
                    </p>

                    {needsWalletReconnect && (
                      <div className="mt-4 border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200">
                        The connected wallet does not match your signed-in Base wallet. Reconnect the same wallet before sending funds.
                      </div>
                    )}

                    <form onSubmit={handleSend} className="mt-4 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-[0.38fr_1fr]">
                        <label className="space-y-2 text-xs uppercase tracking-widest text-zinc-600">
                          Asset
                          <select
                            value={sendAsset}
                            onChange={(event) => setSendAsset(event.target.value as 'USDC' | 'ETH')}
                            className="w-full border border-zinc-800 bg-black px-3 py-3 text-sm text-white outline-none transition-colors focus:border-zinc-600"
                          >
                            <option value="USDC">USDC</option>
                            <option value="ETH">ETH</option>
                          </select>
                        </label>
                        <label className="space-y-2 text-xs uppercase tracking-widest text-zinc-600">
                          Recipient
                          <input
                            value={sendRecipient}
                            onChange={(event) => setSendRecipient(event.target.value)}
                            placeholder="0x..."
                            className="w-full border border-zinc-800 bg-black px-3 py-3 text-sm text-white outline-none transition-colors focus:border-zinc-600"
                          />
                        </label>
                      </div>

                      <label className="space-y-2 text-xs uppercase tracking-widest text-zinc-600">
                        Amount
                        <input
                          value={sendAmount}
                          onChange={(event) => setSendAmount(event.target.value)}
                          inputMode="decimal"
                          placeholder={sendAsset === 'USDC' ? '25.00' : '0.01'}
                          className="w-full border border-zinc-800 bg-black px-3 py-3 text-sm text-white outline-none transition-colors focus:border-zinc-600"
                        />
                      </label>

                      <div className="flex flex-wrap gap-3">
                        {!isConnected && (
                          <button
                            type="button"
                            onClick={() => void connectWallet()}
                            disabled={walletConnecting}
                            className="border border-zinc-700 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:border-zinc-500 disabled:opacity-50"
                          >
                            {walletConnecting ? 'Connecting...' : 'Connect wallet'}
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={sendPending || walletConnecting}
                          className="inline-flex items-center gap-2 bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {sendPending ? 'Sending...' : `Send ${sendAsset}`}
                        </button>
                      </div>

                      {sendError && <p className="text-sm text-red-400">{sendError}</p>}
                      {sendHash && (
                        <a
                          href={`https://basescan.org/tx/${sendHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
                        >
                          Transfer confirmed on Basescan <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </form>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="border border-zinc-800 bg-zinc-950 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-600">Recent activity</p>
                      <h3 className="mt-2 text-lg font-bold text-white">Latest Base transfers</h3>
                    </div>
                    <button
                      onClick={() => void loadWalletState()}
                      disabled={loadingTransactions || isPending}
                      className="text-[10px] uppercase tracking-widest text-zinc-600 transition-colors hover:text-white disabled:opacity-50"
                    >
                      {loadingTransactions ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>

                  <p className="mt-3 text-sm text-zinc-400">
                    This view indexes recent USDC transfers for your Base address. For full history, open Basescan.
                  </p>

                  <div className="mt-4 divide-y divide-zinc-800 border border-zinc-800">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <div key={transaction.hash} className="flex flex-col gap-2 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {transaction.direction === 'received' ? 'Received' : 'Sent'} {formatAmount(transaction.amount, 2)} {transaction.symbol}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {new Date(transaction.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <a
                            href={transaction.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-zinc-300 transition-colors hover:text-white"
                          >
                            {formatAddress(transaction.hash)} <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ))
                    ) : (
                      <div className="bg-zinc-950 p-4 text-sm text-zinc-500">
                        No recent USDC transfers were found in the current indexed window.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="border border-zinc-800 bg-zinc-950 p-6">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600">Agent spend session</p>
                    <h3 className="mt-2 text-lg font-bold text-white">Off-chain billing lane</h3>
                    <p className="mt-3 text-sm text-zinc-400">
                      This remains separate from your Base wallet. Use it only for agent metering and Stripe-funded spend sessions.
                    </p>

                    {mppSession ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-px bg-zinc-800 sm:grid-cols-3">
                          <div className="bg-zinc-950 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-600">Deposited</p>
                            <p className="mt-2 text-lg font-bold text-white">${mppSession.deposit}</p>
                          </div>
                          <div className="bg-zinc-950 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-600">Spent</p>
                            <p className="mt-2 text-lg font-bold text-red-400">${mppSession.spent}</p>
                          </div>
                          <div className="bg-zinc-950 p-3">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-600">Remaining</p>
                            <p className="mt-2 text-lg font-bold text-emerald-400">${mppSession.remaining}</p>
                          </div>
                        </div>
                        <button
                          onClick={closeMppSession}
                          disabled={sessionLoading}
                          className="border border-zinc-700 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:border-zinc-500 disabled:opacity-50"
                        >
                          {sessionLoading ? 'Closing...' : 'Close session'}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        <button
                          onClick={openSession}
                          disabled={sessionLoading || !effectiveAddress}
                          className="bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600"
                        >
                          {sessionLoading ? 'Opening...' : 'Open $10 session'}
                        </button>
                        <div className="grid grid-cols-2 gap-px bg-zinc-800">
                          {TOP_UP_OPTIONS.map((amount) => (
                            <button
                              key={amount}
                              onClick={() => void handleTopUp(amount)}
                              disabled={topUpLoading === amount || !effectiveAddress}
                              className="bg-zinc-950 p-3 text-xs font-mono text-white transition-colors hover:bg-zinc-900 disabled:opacity-50"
                            >
                              {topUpLoading === amount ? '...' : `$${amount}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {walletMeta?.message && (
                    <div className="border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                      {walletMeta.message}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
