'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  TrendingUp,
  Link as LinkIcon,
  Unlink,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Zap,
  RefreshCw,
  Shield,
  BarChart3,
  ArrowUpDown,
  Briefcase,
} from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface RobinhoodStatus {
  connected: boolean
  mcpUrl: string
  platform: string
  features: string[]
}

interface SmokeTestResult {
  reachable: boolean
  status?: number
  latencyMs?: number
  error?: string
}

export default function RobinhoodPage() {
  const queryClient = useQueryClient()
  const [smokeTestResult, setSmokeTestResult] = useState<SmokeTestResult | null>(null)
  const [smokeTesting, setSmokeTesting] = useState(false)
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Fetch connection status
  const {
    data: status,
    isLoading: statusLoading,
  } = useQuery<RobinhoodStatus>({
    queryKey: ['robinhood-status'],
    queryFn: async () => {
      const res = await fetch('/api/robinhood')
      if (!res.ok) throw new Error('Failed to fetch status')
      return res.json()
    },
  })

  // Manual command state
  const [manualCommand, setManualCommand] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const copyCommand = () => {
    if (manualCommand) {
      navigator.clipboard.writeText(manualCommand)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/robinhood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' }),
      })
      return res.json()
    },
    onSuccess: (data) => {
      if (data.manualSetup && data.manualCommand) {
        setManualCommand(data.manualCommand)
        setActionMessage({
          type: 'error',
          text: data.error || 'Gateway unreachable — use manual setup below',
        })
      } else if (data.error) {
        setActionMessage({ type: 'error', text: data.error })
      } else {
        setActionMessage({
          type: 'success',
          text: data.message || 'Connected! Authenticate in your agent with /mcp',
        })
        setManualCommand(null)
        queryClient.invalidateQueries({ queryKey: ['robinhood-status'] })
      }
      setTimeout(() => setActionMessage(null), 10000)
    },
    onError: () => {
      setActionMessage({ type: 'error', text: 'Failed to connect Robinhood' })
      setTimeout(() => setActionMessage(null), 5000)
    },
  })

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/robinhood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      })
      return res.json()
    },
    onSuccess: (data) => {
      setActionMessage({
        type: data.success ? 'success' : 'error',
        text: data.message || (data.success ? 'Disconnected' : 'Failed'),
      })
      queryClient.invalidateQueries({ queryKey: ['robinhood-status'] })
      setTimeout(() => setActionMessage(null), 5000)
    },
  })

  // Smoke test
  const runSmokeTest = async () => {
    setSmokeTesting(true)
    setSmokeTestResult(null)
    try {
      const res = await fetch('/api/robinhood?action=smoke-test')
      const data: SmokeTestResult = await res.json()
      setSmokeTestResult(data)
    } catch {
      setSmokeTestResult({ reachable: false, error: 'Request failed' })
    } finally {
      setSmokeTesting(false)
    }
  }

  const isConnected = status?.connected ?? false

  return (
    <DashboardShell>
      <DashboardHeader
        title="Robinhood Agentic Trading"
        icon={<TrendingUp className="h-5 w-5 text-green-500" />}
      />
      <DashboardContent>
        {/* Action message */}
        {actionMessage && (
          <div
            className={`border p-4 mb-px flex items-center gap-3 ${
              actionMessage.type === 'success'
                ? 'border-green-800 bg-zinc-950'
                : 'border-red-800 bg-zinc-950'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span
              className={`text-xs ${
                actionMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {actionMessage.text}
            </span>
          </div>
        )}

        {/* Manual Setup Command */}
        {manualCommand && (
          <div className="border border-yellow-800 bg-zinc-950 p-6 mb-px">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-400">
                Manual Setup — Gateway Unreachable
              </h3>
            </div>
            <p className="text-[11px] text-zinc-500 mb-4">
              Your agent gateway couldn&apos;t be reached. Run this command in your terminal to
              add Robinhood Trading MCP directly to your OpenClaw config:
            </p>
            <div className="flex gap-2">
              <code className="flex-1 bg-black border border-zinc-800 p-3 text-[11px] text-green-400 font-mono break-all">
                {manualCommand}
              </code>
              <button
                onClick={copyCommand}
                className="border border-zinc-700 hover:border-zinc-500 px-3 text-[10px] font-bold uppercase tracking-widest transition-colors shrink-0"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-[10px] text-zinc-600 mt-3">
              After running the command, restart your gateway: <code className="text-zinc-400">openclaw gateway restart</code>
            </p>
          </div>
        )}

        {/* Connection Status */}
        <div className="border border-zinc-800 bg-zinc-950 p-6 mb-px">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-zinc-700'
                }`}
              />
              <div>
                <h2 className="text-sm font-bold tracking-tight uppercase">
                  {isConnected ? 'Connected' : 'Not Connected'}
                </h2>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">
                  Robinhood Trading MCP
                </p>
              </div>
            </div>

            {statusLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            ) : isConnected ? (
              <button
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="border border-red-800 hover:border-red-600 text-red-400 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Unlink className="h-3.5 w-3.5" />
                )}
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="bg-green-600 hover:bg-green-500 text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                {connectMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LinkIcon className="h-3.5 w-3.5" />
                )}
                Connect Robinhood
              </button>
            )}
          </div>

          {/* MCP Endpoint */}
          <div className="border border-zinc-800 p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                MCP Endpoint
              </div>
              <code className="text-xs text-zinc-400 font-mono">
                {status?.mcpUrl || 'https://agent.robinhood.com/mcp/trading'}
              </code>
            </div>
            <a
              href="https://robinhood.com/us/en/support/articles/agentic-trading-overview/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
            >
              Docs <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-px bg-zinc-800 md:grid-cols-2 lg:grid-cols-3 mb-px">
          {[
            {
              icon: <Briefcase className="h-4 w-4 text-blue-400" />,
              title: 'Portfolio',
              desc: 'Query portfolio value, buying power, and account info',
            },
            {
              icon: <ArrowUpDown className="h-4 w-4 text-orange-400" />,
              title: 'Trading',
              desc: 'Place market, limit, stop, and other order types',
            },
            {
              icon: <BarChart3 className="h-4 w-4 text-orange-400" />,
              title: 'Analysis',
              desc: 'Analyze positions, risks, and market data',
            },
            {
              icon: <RefreshCw className="h-4 w-4 text-cyan-400" />,
              title: 'Rebalancing',
              desc: 'Automated portfolio rebalancing strategies',
            },
            {
              icon: <Zap className="h-4 w-4 text-yellow-400" />,
              title: 'Automation',
              desc: 'Set up recurring trades and price-triggered orders',
            },
            {
              icon: <Shield className="h-4 w-4 text-green-400" />,
              title: 'MCP Protocol',
              desc: 'Open standard — works with any MCP-compatible agent',
            },
          ].map((feature) => (
            <div key={feature.title} className="bg-zinc-950 border border-zinc-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                {feature.icon}
                <h3 className="text-xs font-bold uppercase tracking-widest">
                  {feature.title}
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* What Your Agent Can Do */}
        <div className="border border-zinc-800 bg-zinc-950 p-6 mb-px">
          <h2 className="text-sm font-bold tracking-tight uppercase mb-4">
            What Your Agent Can Do
          </h2>
          <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
            Once connected, your agent can build portfolios, automate trading strategies, analyze
            market data, and manage your investments — all through natural language.
          </p>
          <div className="space-y-3">
            {[
              {
                label: 'Build portfolios',
                prompt:
                  '"Look through news and industry reports to build a portfolio that represents little-known tickers across the AI supply chain."',
              },
              {
                label: 'Automate strategies',
                prompt:
                  '"Buy $100 of ROAR every time the price decreases 2% or more in 1 day."',
              },
              {
                label: 'Rebalance',
                prompt:
                  '"Rebalance my portfolio to achieve a 20% allocation in ROAR and 80% allocation in HMNI."',
              },
              {
                label: 'Analyze risk',
                prompt:
                  '"Look at my portfolio and tell me what risks I\'m exposed to."',
              },
              {
                label: 'Market analysis',
                prompt:
                  '"Why is ROAR up today?" or "Look at news, social sentiment, and recent quotes to build a bull and bear thesis for ROAR."',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="border border-zinc-800 p-3 flex flex-col gap-1"
              >
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  {item.label}
                </div>
                <div className="text-[11px] text-zinc-500 italic leading-relaxed">
                  {item.prompt}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-600 mt-4">
            These examples are for informational purposes only and should not be construed as
            recommendations.
          </p>
        </div>

        {/* Data Access & Agentic Account */}
        <div className="grid gap-px bg-zinc-800 md:grid-cols-2 mb-px">
          <div className="bg-zinc-950 border border-zinc-800 p-6">
            <h2 className="text-sm font-bold tracking-tight uppercase mb-4">
              What Your Agent Can Access
            </h2>
            <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
              When connected, your agent has{' '}<strong className="text-zinc-300">read access</strong> to:
            </p>
            <ul className="space-y-2">
              {[
                'All your Robinhood accounts (including account numbers)',
                'Positions and balances',
                'Transactions and order history',
              ].map((item) => (
                <li
                  key={item}
                  className="text-[11px] text-zinc-400 flex items-start gap-2"
                >
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 border border-zinc-800 p-3">
              <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest mb-1">
                Important
              </p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Your agent can only place trades in your{' '}
                <strong className="text-zinc-300">Agentic account</strong> — not your main
                Robinhood account.
              </p>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-6">
            <h2 className="text-sm font-bold tracking-tight uppercase mb-4">
              Agentic Account
            </h2>
            <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
              A Robinhood Agentic account is a self-directed, individual investing account
              designed for AI agent trading. You can have up to 10 self-directed individual
              accounts, including your Agentic account.
            </p>
            <div className="space-y-3">
              <div className="border border-zinc-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Requirements
                </div>
                <ul className="text-[11px] text-zinc-500 space-y-1">
                  <li>• Primary individual account in good standing</li>
                  <li>• Complete onboarding after MCP connection</li>
                  <li>• Desktop device for authentication</li>
                </ul>
              </div>
              <div className="border border-zinc-800 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Supported Platforms
                </div>
                <p className="text-[11px] text-zinc-500">
                  Claude Code, Claude Desktop, ChatGPT, Codex, Codex CLI, Cursor, Grok, and
                  any MCP-compatible platform.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works + Smoke Test */}
        <div className="grid gap-px bg-zinc-800 md:grid-cols-2">
          {/* How It Works */}
          <div className="bg-zinc-950 border border-zinc-800 p-6">
            <h2 className="text-sm font-bold tracking-tight uppercase mb-4">
              How It Works
            </h2>
            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'Connect',
                  desc: 'Click "Connect Robinhood" above to add the MCP server to your agent config.',
                },
                {
                  step: '02',
                  title: 'Authenticate',
                  desc: 'Ask your agent something like "Check my Robinhood portfolio" — it triggers Robinhood OAuth automatically.',
                },
                {
                  step: '03',
                  title: 'Open Agentic Account',
                  desc: 'Sign in to Robinhood, then follow the on-screen steps to open your Agentic trading account. Desktop only.',
                },
                {
                  step: '04',
                  title: 'Trade',
                  desc: 'Your agent can now query portfolios, analyze markets, and place trades in your Agentic account.',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="text-[10px] font-bold text-zinc-600 font-mono mt-0.5 shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-tight">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smoke Test */}
          <div className="bg-zinc-950 border border-zinc-800 p-6">
            <h2 className="text-sm font-bold tracking-tight uppercase mb-4">
              Endpoint Health
            </h2>
            <p className="text-[11px] text-zinc-500 mb-4">
              Ping the Robinhood MCP endpoint to verify it&apos;s reachable. This doesn&apos;t
              require authentication — just confirms the service is live.
            </p>
            <button
              onClick={runSmokeTest}
              disabled={smokeTesting}
              className="border border-zinc-700 hover:border-zinc-500 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 mb-4"
            >
              {smokeTesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              Run Smoke Test
            </button>

            {smokeTestResult && (
              <div
                className={`border p-4 ${
                  smokeTestResult.reachable
                    ? 'border-green-800'
                    : 'border-red-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {smokeTestResult.reachable ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                  <span
                    className={`text-xs font-bold uppercase tracking-widest ${
                      smokeTestResult.reachable ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {smokeTestResult.reachable ? 'Reachable' : 'Unreachable'}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] font-mono">
                  {smokeTestResult.status && (
                    <div className="text-zinc-500">
                      Status:{' '}
                      <span className="text-zinc-300">{smokeTestResult.status}</span>
                    </div>
                  )}
                  {smokeTestResult.latencyMs !== undefined && (
                    <div className="text-zinc-500">
                      Latency:{' '}
                      <span className="text-zinc-300">
                        {smokeTestResult.latencyMs}ms
                      </span>
                    </div>
                  )}
                  {smokeTestResult.error && (
                    <div className="text-red-400">{smokeTestResult.error}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Risks & Disclaimer */}
        <div className="border border-zinc-800 bg-zinc-950 p-6 mt-px">
          <h2 className="text-sm font-bold tracking-tight uppercase mb-4">Risks</h2>
          <div className="space-y-3 mb-4">
            {[
              'You are ultimately responsible for all trades your AI agent places in your account.',
              'AI agents can make errors, misinterpret instructions, and act on incomplete information.',
              'If you\'ve asked your agent to act without approval, it can place trades without your confirmation.',
              'Before your agent takes action, you can review what it\'s about to do.',
            ].map((risk) => (
              <div key={risk} className="flex items-start gap-2">
                <AlertCircle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-zinc-400 leading-relaxed">{risk}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-800 pt-4">
            <p className="text-[10px] text-zinc-600 leading-relaxed">
              <strong className="text-zinc-500">Disclaimer:</strong> Robinhood Agentic
              Trading involves significant risk, including possible loss of your entire
              investment. Brokerage services by Robinhood Financial LLC (member SIPC). This
              integration uses the official Robinhood Trading MCP endpoint.
            </p>
          </div>
        </div>
      </DashboardContent>
    </DashboardShell>
  )
}
