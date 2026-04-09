'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bitcoin, Copy, RefreshCw, Plus, ArrowDownLeft, Activity } from 'lucide-react'
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

        {/* Blockstream Jade / LWK Integration */}
        <section className="mt-6 bg-zinc-950 border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600">Hardware Wallet</div>
              <h2 className="text-sm font-bold tracking-tight uppercase mt-1">Blockstream Jade + Liquid</h2>
              <p className="text-[10px] text-zinc-500 mt-1">
                🔐 Hardware security: Use Jade hardware wallet with Liquid Network support
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-zinc-800 bg-black/40 p-4">
              <div className="text-xs font-bold text-white mb-2">Jade S1</div>
              <p className="text-[10px] text-zinc-500 mb-3">Air-gapped signing with OLED display</p>
              <div className="text-[10px] text-zinc-600">Bitcoin + Liquid</div>
            </div>
            
            <div className="border border-zinc-800 bg-black/40 p-4">
              <div className="text-xs font-bold text-white mb-2">Multi-Sig</div>
              <p className="text-[10px] text-zinc-500 mb-3">2-of-2 or 2-of-3 with Jade + software</p>
              <div className="text-[10px] text-zinc-600">Enhanced security</div>
            </div>
            
            <div className="border border-zinc-800 bg-black/40 p-4">
              <div className="text-xs font-bold text-white mb-2">Liquid Assets</div>
              <p className="text-[10px] text-zinc-500 mb-3">Issue tokens, stablecoins on Liquid</p>
              <div className="text-[10px] text-zinc-600">Tokenization</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex flex-wrap gap-4">
              <a
                href="/docs/liquid-lwk-railway"
                className="inline-flex items-center gap-2 text-[10px] text-blue-400 hover:text-blue-300"
              >
                Learn how to deploy LWK on Railway →
              </a>
              <a
                href="https://help.blockstream.com/hc/en-us/articles/900002026026-Set-up-a-Liquid-node"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] text-zinc-400 hover:text-white"
              >
                Official Liquid node setup →
              </a>
            </div>
          </div>
        </section>
      </DashboardContent>
    </DashboardShell>
  )
}
