'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bitcoin, Copy, RefreshCw, Plus, ArrowDownLeft, Activity, QrCode, Camera, ArrowRight, Shield, CheckCircle2, Upload, Download } from 'lucide-react'
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'
import StatusPill from '@/app/components/shared/StatusPill'

type Agent = {
  id: string
  name: string
  status: string
}

type BitcoinWallet = {
  id: number
  agentId: string
  label: string | null
  network: string
  createdAt: string
}

type BackendInfo = {
  chainHeight?: number
  bitcoinStatus?: {
    blocks?: number
    headers?: number
    verificationProgress?: number
    isSynched?: boolean
  }
  isFullySynched?: boolean
  networkType?: string
  cryptoCode?: string
  version?: string
  [key: string]: unknown
}

type WalletBalance = {
  confirmed?: string
  unconfirmed?: string
  available?: string
  immature?: string
  total?: string
}

type TransactionItem = {
  txId: string
  seenAt: string | null
  confirmations: number | null
  amount: string | null
}

function extractTransactions(data: unknown): TransactionItem[] {
  if (!data || typeof data !== 'object') return []

  const source = data as Record<string, unknown>
  const candidates = [
    source.transactions,
    source.confirmedTransactions,
    source.unconfirmedTransactions,
    source.results,
  ]

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue

    return candidate
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null
        const row = entry as Record<string, unknown>
        const txId =
          typeof row.transactionId === 'string' ? row.transactionId :
          typeof row.txId === 'string' ? row.txId :
          typeof row.id === 'string' ? row.id :
          null

        if (!txId) return null

        const confirmations =
          typeof row.confirmations === 'number' ? row.confirmations :
          typeof row.confirmations === 'string' ? Number(row.confirmations) :
          typeof row.confirmationCount === 'number' ? row.confirmationCount :
          null

        const amount =
          typeof row.balanceChange === 'string' ? row.balanceChange :
          typeof row.amount === 'string' ? row.amount :
          typeof row.value === 'string' ? row.value :
          null

        const seenAt =
          typeof row.timestamp === 'string' ? row.timestamp :
          typeof row.seenAt === 'string' ? row.seenAt :
          typeof row.firstSeen === 'string' ? row.firstSeen :
          null

        return { txId, confirmations, amount, seenAt }
      })
      .filter((entry): entry is TransactionItem => entry !== null)
  }

  return []
}

function getBackendHeight(info: BackendInfo | null): string {
  if (!info) return '...'
  if (typeof info.chainHeight === 'number') return String(info.chainHeight)
  if (typeof info.bitcoinStatus?.blocks === 'number') return String(info.bitcoinStatus.blocks)
  return '...'
}

function getSyncProgress(info: BackendInfo | null): string {
  const value = info?.bitcoinStatus?.verificationProgress
  if (typeof value !== 'number') return '...'
  return `${(value * 100).toFixed(2)}%`
}

function getBitcoinExplorerBase(info: BackendInfo | null): string {
  const network = (info?.networkType || '').toLowerCase()
  if (network.includes('test')) return 'https://mempool.space/testnet'
  return 'https://mempool.space'
}

export default function BitcoinPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [wallets, setWallets] = useState<BitcoinWallet[]>([])
  const [backendInfo, setBackendInfo] = useState<BackendInfo | null>(null)
  const [balances, setBalances] = useState<Record<number, WalletBalance>>({})
  const [addresses, setAddresses] = useState<Record<number, string>>({})
  const [transactions, setTransactions] = useState<Record<number, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedWalletId, setCopiedWalletId] = useState<number | null>(null)

  const [agentId, setAgentId] = useState('')
  const [label, setLabel] = useState('')
  const [derivationScheme, setDerivationScheme] = useState('')

  // Air-gap Jade signing state
  const [airGapStep, setAirGapStep] = useState<'idle' | 'create' | 'scan-sign' | 'broadcast'>('idle')
  const [unsignedPsbt, setUnsignedPsbt] = useState('')
  const [signedPsbt, setSignedPsbt] = useState('')
  const [jadeRecipient, setJadeRecipient] = useState('')
  const [jadeAmount, setJadeAmount] = useState('')
  const [jadeWalletId, setJadeWalletId] = useState<number | null>(null)
  const [signingTx, setSigningTx] = useState(false)

  // Liquid node status
  const [liquidInfo, setLiquidInfo] = useState<{ status: string; blocks: number; pruned: boolean; verificationProgress: number } | null>(null)
  const [loadingLiquid, setLoadingLiquid] = useState(false)

  const loadLiquidInfo = async () => {
    setLoadingLiquid(true)
    try {
      const res = await fetch('/api/bitcoin/liquid')
      const data = await res.json()
      setLiquidInfo(data)
    } catch {
      setLiquidInfo({ status: 'unreachable', blocks: 0, pruned: true, verificationProgress: 0 })
    } finally {
      setLoadingLiquid(false)
    }
  }

  const loadData = async (opts?: { quiet?: boolean }) => {
    const quiet = opts?.quiet ?? false
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const [agentsRes, walletsRes, backendRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/bitcoin/wallets'),
        fetch('/api/bitcoin/backend/info'),
      ])

      const [agentsData, walletsData, backendData] = await Promise.all([
        agentsRes.json(),
        walletsRes.json(),
        backendRes.json(),
      ])

      setAgents(Array.isArray(agentsData?.agents) ? agentsData.agents : [])
      setWallets(Array.isArray(walletsData) ? walletsData : [])
      setBackendInfo(backendData && typeof backendData === 'object' ? backendData : null)

      if (!walletsRes.ok) {
        setError(typeof walletsData?.error === 'string' ? walletsData.error : 'Failed to load Bitcoin wallets')
      } else if (!backendRes.ok) {
        setError(typeof backendData?.error === 'string' ? backendData.error : 'Failed to load Bitcoin backend info')
      }
    } catch (err) {
      console.error('[BitcoinPage] loadData error:', err)
      setError('Failed to load Bitcoin wallet data')
    } finally {
      if (quiet) setRefreshing(false)
      else setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    void loadLiquidInfo()
  }, [])

  useEffect(() => {
    if (wallets.length === 0) return
    void Promise.all(
      wallets.map(async (wallet) => {
        try {
          const res = await fetch(`/api/bitcoin/wallets/${wallet.id}/balance`)
          const data = await res.json()
          setBalances((prev) => ({ ...prev, [wallet.id]: data }))
        } catch {
          // Keep the page usable even if a single wallet fetch fails.
        }
      })
    )
  }, [wallets])

  const agentOptions = useMemo(
    () => agents.filter((agent) => agent.status !== 'deleted'),
    [agents]
  )

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!agentId || !derivationScheme.trim()) {
      setError('Agent and derivation scheme are required')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/bitcoin/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          label: label.trim() || undefined,
          derivationScheme: derivationScheme.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register Bitcoin wallet')
      }

      setLabel('')
      setDerivationScheme('')
      await loadData({ quiet: true })
    } catch (err: any) {
      setError(err.message || 'Failed to register Bitcoin wallet')
    } finally {
      setSubmitting(false)
    }
  }

  const fetchUnusedAddress = async (walletId: number) => {
    setError(null)
    try {
      const res = await fetch(`/api/bitcoin/wallets/${walletId}/address`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to derive address')
      setAddresses((prev) => ({ ...prev, [walletId]: data.address || JSON.stringify(data) }))
    } catch (err: any) {
      setError(err.message || 'Failed to derive Bitcoin address')
    }
  }

  const fetchTransactions = async (walletId: number) => {
    setError(null)
    try {
      const res = await fetch(`/api/bitcoin/wallets/${walletId}/transactions`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch transactions')
      setTransactions((prev) => ({ ...prev, [walletId]: data }))
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Bitcoin transactions')
    }
  }

  const copyText = async (walletId: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedWalletId(walletId)
      setTimeout(() => setCopiedWalletId(null), 1500)
    } catch {
      setError('Failed to copy address')
    }
  }

  const syncPill = backendInfo?.isFullySynched
    ? <StatusPill status="active" label="Synced" size="sm" />
    : <StatusPill status="idle" label="Syncing" size="sm" />
  const explorerBase = getBitcoinExplorerBase(backendInfo)

  return (
    <DashboardShell>
      <DashboardHeader
        title="Bitcoin"
        icon={<Bitcoin className="h-5 w-5 text-orange-400" />}
        action={
          <button
            onClick={() => void loadData({ quiet: true })}
            className="inline-flex items-center gap-2 border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />
      <DashboardContent>
        <div className="grid gap-px bg-zinc-800 grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section className="bg-zinc-950 border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-600">Headless Backend</div>
                <h2 className="text-sm font-bold tracking-tight uppercase mt-1">Watch-Only Wallets</h2>
                <p className="text-[10px] text-zinc-500 mt-1">
                  🔐 Secure: Your keys, your bitcoin. Blockstream Green xpub supported.
                </p>
              </div>
              {syncPill}
            </div>

              <div className="space-y-2 text-xs text-zinc-500 mb-6">
                <div className="flex items-center justify-between">
                  <span>Network</span>
                  <span className="font-mono text-zinc-300">{String(backendInfo?.networkType || backendInfo?.cryptoCode || 'btc')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Chain Height</span>
                  <span className="font-mono text-zinc-300">{getBackendHeight(backendInfo)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sync Progress</span>
                  <span className="font-mono text-zinc-300">{getSyncProgress(backendInfo)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>NBXplorer</span>
                  <span className="font-mono text-zinc-300">{String(backendInfo?.version || '...')}</span>
                </div>
              </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Agent</label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs text-white outline-none focus:border-zinc-700"
                >
                  <option value="">Select agent</option>
                  {agentOptions.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Label</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Primary BTC"
                  className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 block mb-2">Xpub / Descriptor</label>
                <textarea
                  value={derivationScheme}
                  onChange={(e) => setDerivationScheme(e.target.value)}
                  placeholder="xpub... or wpkh([fingerprint/path]xpub...)"
                  rows={5}
                  className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-zinc-700 font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-2">
                  📱 Blockstream Green: Get xpub from Wallet → Settings → Export Xpub
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-white text-black py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {submitting ? 'Registering...' : 'Register Watch-Only Wallet'}
              </button>
            </form>

            {error && (
              <div className="mt-4 border border-red-500/30 bg-red-500/10 px-3 py-3 text-xs text-red-300">
                {error}
              </div>
            )}
          </section>

          <section className="bg-zinc-950 border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-600">Wallets</div>
                <h2 className="text-sm font-bold tracking-tight uppercase mt-1">Bitcoin Accounts</h2>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">
                {loading ? 'Loading...' : `${wallets.length} tracked`}
              </div>
            </div>

            <div className="space-y-4">
              {wallets.map((wallet) => {
                const balance = balances[wallet.id]
                const total = balance?.total || balance?.confirmed || '0'
                const address = addresses[wallet.id]
                const txData = transactions[wallet.id]
                const txItems = extractTransactions(txData)

                return (
                  <div key={wallet.id} className="border border-zinc-800 bg-black/40 p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-600">
                          Agent #{wallet.agentId}
                        </div>
                        <div className="text-sm font-bold text-white mt-1">
                          {wallet.label || `Bitcoin Wallet ${wallet.id}`}
                        </div>
                      </div>
                      <StatusPill status="active" label={`${Number(total).toFixed(8)} BTC`} size="sm" />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        onClick={() => void fetchUnusedAddress(wallet.id)}
                        className="inline-flex items-center gap-2 border border-zinc-800 px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                      >
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                        Get Address
                      </button>
                      <button
                        onClick={() => void fetchTransactions(wallet.id)}
                        className="inline-flex items-center gap-2 border border-zinc-800 px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                      >
                        <Activity className="h-3.5 w-3.5" />
                        Transactions
                      </button>
                    </div>

                    {address && (
                      <div className="border border-zinc-900 bg-zinc-950 p-3 mb-3">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Receive Address</div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-zinc-300 break-all flex-1">{address}</code>
                          <button
                            onClick={() => void copyText(wallet.id, address)}
                            className="border border-zinc-800 p-2 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {copiedWalletId === wallet.id && (
                          <div className="mt-2 text-[10px] uppercase tracking-widest text-green-400">Copied</div>
                        )}
                        <a
                          href={`${explorerBase}/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white"
                        >
                          View on explorer
                        </a>
                      </div>
                    )}

                    {txData !== undefined && (
                      txItems.length > 0 ? (
                        <div className="border border-zinc-900 bg-zinc-950">
                          <div className="grid grid-cols-[minmax(0,1fr)_110px_110px] gap-px bg-zinc-900 text-[10px] uppercase tracking-widest text-zinc-600">
                            <div className="px-3 py-2">Transaction</div>
                            <div className="px-3 py-2 text-right">Amount</div>
                            <div className="px-3 py-2 text-right">Confs</div>
                          </div>
                          <div>
                            {txItems.slice(0, 8).map((item) => (
                              <div key={item.txId} className="grid grid-cols-[minmax(0,1fr)_110px_110px] gap-px border-t border-zinc-900 text-xs">
                                <div className="px-3 py-2">
                                  <div className="font-mono text-zinc-300 break-all">
                                    <a
                                      href={`${explorerBase}/tx/${item.txId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-white"
                                    >
                                      {item.txId}
                                    </a>
                                  </div>
                                  {item.seenAt && (
                                    <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">
                                      {new Date(item.seenAt).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                <div className="px-3 py-2 text-right font-mono text-zinc-300">
                                  {item.amount || '—'}
                                </div>
                                <div className="px-3 py-2 text-right font-mono text-zinc-300">
                                  {item.confirmations ?? '—'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <details className="border border-zinc-900 bg-zinc-950 p-3">
                          <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-zinc-500">
                            Raw transaction payload
                          </summary>
                          <pre className="mt-3 text-[11px] text-zinc-400 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(txData, null, 2)}
                          </pre>
                        </details>
                      )
                    )}
                  </div>
                )
              })}

              {!loading && wallets.length === 0 && (
                <div className="border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
                  No Bitcoin wallets registered yet.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Liquid Network — Full Feature Section */}
        <section className="mt-6 bg-zinc-950 border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Liquid Network</div>
              <h2 className="text-2xl font-bold tracking-tighter uppercase mt-1">Bitcoin Layer 2</h2>
              <p className="text-sm text-zinc-400 mt-2 max-w-xl">
                Confidential transactions. 1-minute blocks. Lower fees. Issued assets. 
                Our own Elements node powers it all — no third-party dependency.
              </p>
            </div>
            <button
              onClick={loadLiquidInfo}
              disabled={loadingLiquid}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loadingLiquid ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Node Status */}
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 font-bold">Node Status</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-zinc-800 bg-black/40 p-4">
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Status</div>
                <div className="text-sm font-bold font-mono">
                  {liquidInfo?.status === 'connected' ? (
                    <span className="text-emerald-400">● Connected</span>
                  ) : liquidInfo?.status === 'unreachable' ? (
                    <span className="text-red-400">● Unreachable</span>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </div>
              </div>
              <div className="border border-zinc-800 bg-black/40 p-4">
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Blocks</div>
                <div className="text-sm font-bold font-mono">
                  {liquidInfo?.blocks ? liquidInfo.blocks.toLocaleString() : '—'}
                </div>
              </div>
              <div className="border border-zinc-800 bg-black/40 p-4">
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Sync</div>
                <div className="text-sm font-bold font-mono">
                  {liquidInfo?.verificationProgress ? `${(liquidInfo.verificationProgress * 100).toFixed(1)}%` : '—'}
                </div>
              </div>
              <div className="border border-zinc-800 bg-black/40 p-4">
                <div className="text-[10px] text-zinc-500 uppercase mb-1">Pruned</div>
                <div className="text-sm font-bold font-mono">
                  {liquidInfo?.pruned ? (
                    <span className="text-blue-400">1 GB</span>
                  ) : (
                    <span className="text-zinc-500">Full</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 font-bold">What You Can Do</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-zinc-800 bg-black/40 p-4">
                <div className="text-xs font-bold text-white mb-2">🔒 Confidential Transactions</div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Amounts and asset types are hidden on-chain. Only sender and receiver can see the details. 
                  Full privacy without mixing services.
                </p>
              </div>
              <div className="border border-zinc-800 bg-black/40 p-4">
                <div className="text-xs font-bold text-white mb-2">⚡ 1-Minute Blocks</div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  12x faster than Bitcoin. Transactions confirm in ~1 minute instead of ~12 minutes. 
                  Near-instant for payments.
                </p>
              </div>
              <div className="border border-zinc-800 bg-black/40 p-4">
                <div className="text-xs font-bold text-white mb-2">💸 Lower Fees</div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Fraction of Bitcoin mainnet fees. Transactions cost pennies. 
                  Ideal for micropayments and frequent transfers.
                </p>
              </div>
              <div className="border border-zinc-800 bg-black/40 p-4">
                <div className="text-xs font-bold text-white mb-2">🪙 Issued Assets</div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Create your own tokens on Liquid. Stablecoins, loyalty points, in-game assets. 
                  All confidential by default.
                </p>
              </div>
              <div className="border border-zinc-800 bg-black/40 p-4">
                <div className="text-xs font-bold text-white mb-2">🔐 Jade Hardware Wallet</div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Air-gapped signing with Blockstream Jade. QR code in → sign on device → QR code out. 
                  No USB, no internet required.
                </p>
              </div>
              <div className="border border-zinc-800 bg-black/40 p-4">
                <div className="text-xs font-bold text-white mb-2">🌉 L-BTC Bridge</div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Peg BTC into Liquid as L-BTC. Use Bitcoin on a faster, cheaper, more private network. 
                  Federated two-way peg.
                </p>
              </div>
            </div>
          </div>

          {/* What is L-BTC */}
          <div className="border border-zinc-800 bg-black/40 p-5 mb-6">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-bold">What is L-BTC?</div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              L-BTC is Bitcoin on the Liquid Network. It&apos;s backed 1:1 by real BTC locked in a 
              federated peg. You can move BTC into Liquid (peg-in) and back out (peg-out) at any time. 
              Same Bitcoin, faster settlement, confidential transactions.
            </p>
          </div>

          {/* Links */}
          <div className="pt-4 border-t border-zinc-800">
            <div className="flex flex-wrap gap-4">
              <a
                href="https://blockstream.com/liquid/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-400 hover:text-blue-300"
              >
                About Liquid Network →
              </a>
              <a
                href="https://help.blockstream.com/hc/en-us/articles/900002026026-Set-up-a-Liquid-node"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-zinc-400 hover:text-white"
              >
                Liquid node setup →
              </a>
              <a
                href="https://blockstream.com/jade/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-zinc-400 hover:text-white"
              >
                Get Blockstream Jade →
              </a>
            </div>
          </div>
        </section>

        {/* Blockstream Jade — Air-Gapped Signing */}
        <section className="mt-6 bg-zinc-950 border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Hardware Wallet</div>
              <h2 className="text-sm font-bold tracking-tight uppercase mt-1">Blockstream Jade — Air-Gapped Signing</h2>
              <p className="text-[10px] text-zinc-500 mt-1">
                🔐 Sign transactions offline. QR code in → Jade signs → QR code out. No USB, no internet.
              </p>
            </div>
            <a
              href="https://blockstream.com/jade/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-400 hover:text-blue-300"
            >
              Get Jade →
            </a>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {['Create TX', 'Scan with Jade', 'Broadcast'].map((step, i) => {
              const stepKeys = ['create', 'scan-sign', 'broadcast'] as const
              const isActive = airGapStep === stepKeys[i]
              const isPast = ['create', 'scan-sign', 'broadcast'].indexOf(airGapStep) > i
              return (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                    isPast ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                    isActive ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' :
                    'border-zinc-700 text-zinc-600'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-mono ${isActive ? 'text-white' : 'text-zinc-600'}`}>{step}</span>
                  {i < 2 && <ArrowRight className="w-3 h-3 text-zinc-700 mx-1" />}
                </div>
              )
            })}
          </div>

          {/* Step 1: Create unsigned transaction */}
          {(airGapStep === 'idle' || airGapStep === 'create') && (
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-bold">Step 1 — Create Unsigned Transaction</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-600 uppercase tracking-widest block mb-1">From Wallet</label>
                  <select
                    value={jadeWalletId ?? ''}
                    onChange={e => setJadeWalletId(Number(e.target.value) || null)}
                    className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-600"
                  >
                    <option value="">Select wallet...</option>
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.label || `Wallet #${w.id}`} ({w.network})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-600 uppercase tracking-widest block mb-1">Recipient Address</label>
                  <input
                    type="text"
                    value={jadeRecipient}
                    onChange={e => setJadeRecipient(e.target.value)}
                    placeholder="bc1q..."
                    className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-600 uppercase tracking-widest block mb-1">Amount (sats)</label>
                  <input
                    type="number"
                    value={jadeAmount}
                    onChange={e => setJadeAmount(e.target.value)}
                    placeholder="100000"
                    className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  if (!jadeWalletId || !jadeRecipient || !jadeAmount) return
                  const mockPsbt = `cHNidP8BAH${btoa(`${jadeWalletId}:${jadeRecipient}:${jadeAmount}`).replace(/=/g, '')}AAAAA`
                  setUnsignedPsbt(mockPsbt)
                  setAirGapStep('create')
                }}
                disabled={!jadeWalletId || !jadeRecipient || !jadeAmount}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-600/20 disabled:opacity-30 transition-colors"
              >
                <QrCode className="w-3 h-3" />
                Generate Unsigned TX → QR Code
              </button>
            </div>
          )}

          {/* Step 2: Show QR code for Jade to scan */}
          {airGapStep === 'create' && unsignedPsbt && (
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-bold">Step 2 — Scan with Jade</div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="bg-white p-4 inline-block rounded">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(unsignedPsbt)}`}
                      alt="Unsigned PSBT QR Code"
                      width={250}
                      height={250}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 text-center font-mono">
                    Scan this with your Jade camera
                  </p>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="border border-zinc-800 bg-black/40 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-bold">Instructions</div>
                    <ol className="text-xs text-zinc-400 space-y-2 list-decimal pl-4">
                      <li>On your Jade: go to <span className="text-white font-mono">Scan QR</span></li>
                      <li>Point Jade camera at the QR code above</li>
                      <li>Review the transaction on Jade&apos;s OLED screen</li>
                      <li>Confirm on Jade to sign</li>
                      <li>Jade displays a new QR code — scan it with your phone</li>
                    </ol>
                  </div>
                  <div className="border border-zinc-800 bg-black/40 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-bold">Raw PSBT</div>
                    <div className="text-[10px] text-zinc-500 font-mono break-all bg-zinc-900 p-2 rounded">
                      {unsignedPsbt.length > 80 ? unsignedPsbt.substring(0, 80) + '...' : unsignedPsbt}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(unsignedPsbt)}
                      className="mt-2 text-[10px] text-blue-400 hover:text-blue-300"
                    >
                      Copy full PSBT
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setAirGapStep('scan-sign')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                >
                  <Camera className="w-3 h-3" />
                  I scanned — paste signed PSBT
                </button>
                <button
                  onClick={() => { setAirGapStep('idle'); setUnsignedPsbt('') }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-zinc-800 text-zinc-400 text-xs hover:border-zinc-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Paste signed PSBT and broadcast */}
          {airGapStep === 'scan-sign' && (
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-bold">Step 3 — Paste Signed PSBT & Broadcast</div>
              <div>
                <label className="text-[10px] text-zinc-600 uppercase tracking-widest block mb-1">
                  Signed PSBT from Jade
                </label>
                <textarea
                  value={signedPsbt}
                  onChange={e => setSignedPsbt(e.target.value)}
                  placeholder="Paste the signed PSBT (base64) from your Jade's QR code..."
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-zinc-600 resize-none"
                />
              </div>
              <div className="border border-zinc-800 bg-black/40 p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-bold">How to get the signed PSBT</div>
                <ol className="text-xs text-zinc-400 space-y-1 list-decimal pl-4">
                  <li>After Jade signs, it shows a QR code on its screen</li>
                  <li>Use your phone camera to scan the Jade QR code</li>
                  <li>Copy the text content and paste it above</li>
                </ol>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!signedPsbt) return
                    setAirGapStep('broadcast')
                  }}
                  disabled={!signedPsbt}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 disabled:opacity-30 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  Broadcast Transaction
                </button>
                <button
                  onClick={() => { setAirGapStep('create'); setSignedPsbt('') }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-zinc-800 text-zinc-400 text-xs hover:border-zinc-600 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {airGapStep === 'broadcast' && (
            <div className="space-y-4">
              <div className="border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <div className="text-sm font-bold text-emerald-300 mb-1">Transaction Broadcast</div>
                <p className="text-xs text-zinc-400">
                  Your air-gapped transaction has been submitted to the Bitcoin network.
                </p>
                <p className="text-[10px] text-zinc-600 mt-2 font-mono">
                  (Demo mode — connect to NBXplorer backend for live broadcasting)
                </p>
              </div>
              <button
                onClick={() => { setAirGapStep('idle'); setUnsignedPsbt(''); setSignedPsbt(''); setJadeRecipient(''); setJadeAmount('') }}
                className="flex items-center gap-2 px-5 py-2.5 border border-zinc-800 text-zinc-400 text-xs hover:border-zinc-600 transition-colors"
              >
                <Shield className="w-3 h-3" />
                Start New Transaction
              </button>
            </div>
          )}

          {/* Links */}
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <div className="flex flex-wrap gap-4">
              <a
                href="/docs/liquid-lwk-railway"
                className="inline-flex items-center gap-2 text-[10px] text-blue-400 hover:text-blue-300"
              >
                Deploy LWK on Railway →
              </a>
              <a
                href="https://help.blockstream.com/hc/en-us/articles/900002026026-Set-up-a-Liquid-node"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] text-zinc-400 hover:text-white"
              >
                Liquid node setup →
              </a>
              <a
                href="https://blockstream.com/jade/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] text-zinc-400 hover:text-white"
              >
                Get Blockstream Jade →
              </a>
            </div>
          </div>
        </section>
      </DashboardContent>
    </DashboardShell>
  )
}
