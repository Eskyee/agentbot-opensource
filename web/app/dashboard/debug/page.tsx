'use client'

import { useState, useRef, useEffect } from 'react'
import { Terminal, Play, Trash2, Clock, ChevronDown, RefreshCw } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

const COMMANDS = [
  { value: 'gateway.restart', label: 'gateway.restart — restart the agent gateway' },
  { value: 'openclaw.doctor', label: 'openclaw.doctor — run health diagnostics' },
  { value: 'openclaw.logs.tail', label: 'openclaw.logs.tail — view recent logs (last 50 lines)' },
  { value: 'openclaw.status', label: 'openclaw.status — get agent status' },
  { value: 'openclaw.config.show', label: 'openclaw.config.show — display current config' },
  { value: 'openclaw.memory.stats', label: 'openclaw.memory.stats — memory usage stats' },
  { value: 'openclaw.skills.list', label: 'openclaw.skills.list — list installed skills' },
  { value: 'openclaw.channels.status', label: 'openclaw.channels.status — check channel connections' },
  { value: 'openclaw.cron.list', label: 'openclaw.cron.list — list scheduled tasks' },
  { value: 'openclaw.version', label: 'openclaw.version — show version info' },
]

interface CommandResult {
  command: string
  output: string
  exitCode: number
  duration: number
  timestamp: string
}

interface HistoryEntry {
  command: string
  timestamp: string
  exitCode: number
  duration: number
}

export default function DebugConsolePage() {
  const [selectedCommand, setSelectedCommand] = useState(COMMANDS[0].value)
  const [output, setOutput] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [lastResult, setLastResult] = useState<CommandResult | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [output])

  const executeCommand = async (cmd?: string) => {
    const command = cmd || selectedCommand
    setLoading(true)
    setOutput(`$ ${command}\nExecuting...`)

    try {
      const res = await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, agentId: 'default' }),
      })

      const data = await res.json()

      if (!res.ok) {
        setOutput(`Error: ${data.error || 'Command failed'}`)
        return
      }

      const result: CommandResult = data
      setLastResult(result)
      setOutput(result.output)

      // Add to history
      setHistory(prev => {
        const entry: HistoryEntry = {
          command: result.command,
          timestamp: result.timestamp,
          exitCode: result.exitCode,
          duration: result.duration,
        }
        return [entry, ...prev].slice(0, 10)
      })
    } catch {
      setOutput('Error: Failed to execute command — network error')
    } finally {
      setLoading(false)
    }
  }

  const clearOutput = () => {
    setOutput('')
    setLastResult(null)
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Debug Console"
        icon={<Terminal className="h-5 w-5 text-blue-400" />}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => executeCommand()}
              disabled={loading}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              {loading ? 'Running' : 'Execute'}
            </button>
          </div>
        }
      />

      <DashboardContent className="max-w-6xl space-y-6">
        {/* Command selector */}
        <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-4">
          <label className="text-[10px] uppercase tracking-widest text-zinc-600 block">
            Command
          </label>
          <div className="relative">
            <select
              value={selectedCommand}
              onChange={e => setSelectedCommand(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white text-sm font-mono px-4 py-3 appearance-none cursor-pointer focus:outline-none focus:border-blue-500 transition-colors"
            >
              {COMMANDS.map(cmd => (
                <option key={cmd.value} value={cmd.value}>
                  {cmd.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none" />
          </div>
        </div>

        {/* Output panel */}
        <div className="border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
              <Terminal className="h-3.5 w-3.5" />
              Output
              {lastResult && (
                <span className="text-zinc-700">
                  — {lastResult.command} — {lastResult.duration}ms — exit {lastResult.exitCode}
                </span>
              )}
            </div>
            <button
              onClick={clearOutput}
              className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          </div>
          <div
            ref={outputRef}
            className="p-5 font-mono text-sm text-green-400 bg-zinc-950 min-h-[280px] max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed"
          >
            {output || (
              <span className="text-zinc-700">
                Select a command and click Execute, or run from history.
              </span>
            )}
          </div>
        </div>

        {/* Command history */}
        {history.length > 0 && (
          <div className="border border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-600">
              <Clock className="h-3.5 w-3.5" />
              Recent Commands
            </div>
            <div className="divide-y divide-zinc-800/50">
              {history.map((entry, i) => (
                <button
                  key={`${entry.timestamp}-${i}`}
                  onClick={() => {
                    setSelectedCommand(entry.command)
                    executeCommand(entry.command)
                  }}
                  disabled={loading}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        entry.exitCode === 0 ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                    />
                    <span className="text-xs font-mono text-zinc-300 group-hover:text-white truncate">
                      {entry.command}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600 flex-shrink-0">
                    <span>{entry.duration}ms</span>
                    <span>
                      {new Date(entry.timestamp).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </DashboardContent>
    </DashboardShell>
  )
}
