/**
 * SandboxWorkbench — Vercel Sandbox-backed live preview.
 *
 * Creates a Vercel Sandbox VM, writes generated files into it,
 * starts a dev server, and renders the preview in an iframe.
 * Supports full Next.js App Router, API routes, databases, terminal.
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Spinner } from '@/app/components/ui/spinner'

export type SandboxFile = {
  path: string
  language: string
  content: string
}

export type SandboxWorkbenchProps = {
  generationKey: string
  files: SandboxFile[]
  mode: 'preview' | 'terminal'
  isStreaming: boolean
  envVars?: Record<string, string>
  onFilesChange?: (files: { path: string; content: string }[]) => void
  onError?: (error: string) => void
}

type SandboxState = {
  sessionId: string | null
  name: string | null
  previewUrl: string | null
  status: 'idle' | 'creating' | 'writing' | 'installing' | 'starting' | 'ready' | 'stopping' | 'error'
  error: string | null
}

const WRITE_DEBOUNCE_MS = 800
const HEARTBEAT_MS = 4 * 60 * 1000

const STEP_LABELS: Record<string, string[]> = {
  creating: ['Requesting VM from Vercel', 'Allocating resources', 'Booting Linux'],
  writing: ['Transferring files to VM'],
  installing: ['Running npm install', 'Resolving dependencies', 'Linking packages'],
  starting: ['Starting dev server', 'Compiling app', 'Waiting for first render'],
}

function SandboxLoading({ status, message, name }: { status: string; message?: string; name?: string | null }) {
  const [elapsed, setElapsed] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    setElapsed(0)
    setStepIdx(0)
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000)
    const stepTimer = setInterval(() => setStepIdx((i) => i + 1), 4000)
    return () => { clearInterval(timer); clearInterval(stepTimer) }
  }, [status])

  const steps = STEP_LABELS[status] || []
  const currentStep = steps[stepIdx % steps.length] || message || 'Working…'

  return (
    <div className="h-full min-h-[488px] bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <Spinner size={24} />
        <div className="mt-4 text-[10px] uppercase tracking-widest text-orange-500">
          {message || 'Loading…'}
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500 min-h-[14px]">
          {currentStep}
        </div>
        <div className="mt-1 text-[10px] tabular-nums text-zinc-600">{elapsed}s</div>
        {name && (
          <div className="mt-2 text-[10px] uppercase tracking-widest text-zinc-700">{name}</div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: SandboxState['status'] }) {
  const colors: Record<string, string> = {
    ready: 'bg-green-500/20 text-green-400 border-green-500/30',
    creating: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    writing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    installing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    starting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    stopping: 'bg-red-500/20 text-red-400 border-red-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    idle: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[9px] uppercase tracking-widest ${colors[status] || colors.idle}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'ready' ? 'bg-green-400 animate-pulse' : status === 'error' ? 'bg-red-400' : 'bg-current'}`} />
      {status}
    </span>
  )
}

export default function SandboxWorkbench({
  generationKey,
  files,
  mode,
  isStreaming,
  envVars,
  onFilesChange,
  onError,
}: SandboxWorkbenchProps) {
  const [sandbox, setSandbox] = useState<SandboxState>({
    sessionId: null,
    name: null,
    previewUrl: null,
    status: 'idle',
    error: null,
  })
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [terminalInput, setTerminalInput] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastWrittenKeyRef = useRef<string>('')
  const mountedRef = useRef(true)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const stopSandbox = useCallback(async () => {
    if (!sandbox.sessionId) return
    setSandbox((s) => ({ ...s, status: 'stopping' }))
    try {
      await fetch('/api/playground/sandbox/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sandbox.sessionId }),
      })
    } catch {}
  }, [sandbox.sessionId])

  useEffect(() => {
    return () => {
      if (sandbox.sessionId && mountedRef.current) {
        fetch('/api/playground/sandbox/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sandbox.sessionId }),
        }).catch(() => {})
      }
    }
  }, [sandbox.sessionId])

  useEffect(() => {
    if (sandbox.status === 'ready' && sandbox.sessionId) {
      heartbeatRef.current = setInterval(() => {
        fetch('/api/playground/sandbox/extend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sandbox.sessionId, duration: 30 * 60 * 1000 }),
        }).catch(() => {})
      }, HEARTBEAT_MS)
    }
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current) }
  }, [sandbox.status, sandbox.sessionId])

  const createSandbox = useCallback(async (): Promise<string | null> => {
    if (!mountedRef.current) return null
    setSandbox((s) => ({ ...s, status: 'creating', error: null }))

    try {
      const res = await fetch('/api/playground/sandbox/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runtime: 'node24', ports: [3000], env: envVars }),
      })
      const data = await res.json()
      console.log('[sandbox] create response:', data)
      if (!data.ok) throw new Error(data.error)
      if (!data.sandbox?.sessionId) throw new Error('No sessionId returned')
      if (!mountedRef.current) return null

      setSandbox({
        sessionId: data.sandbox.sessionId,
        name: data.sandbox.name,
        previewUrl: data.sandbox.previewUrl,
        status: 'writing',
        error: null,
      })
      return data.sandbox.sessionId as string
    } catch (error) {
      if (!mountedRef.current) return null
      const msg = error instanceof Error ? error.message : 'Failed to create sandbox'
      setSandbox((s) => ({ ...s, status: 'error', error: msg }))
      onError?.(msg)
      return null
    }
  }, [envVars, onError])

  const writeFiles = useCallback(async (sessionId: string, filesToWrite: SandboxFile[]) => {
    if (!mountedRef.current || filesToWrite.length === 0) return

    try {
      const res = await fetch('/api/playground/sandbox/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          files: filesToWrite.map((f) => ({
            path: f.path.startsWith('/') ? f.path : `/vercel/sandbox/${f.path}`,
            content: f.content,
          })),
          runInstall: true,
        }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      if (!mountedRef.current) return

      setSandbox((s) => ({ ...s, status: 'installing' }))
      if (data.installError) {
        setTerminalOutput((prev) => [...prev, `[npm install error] ${data.installError}`])
      }
    } catch (error) {
      if (!mountedRef.current) return
      const msg = error instanceof Error ? error.message : 'Failed to write files'
      setSandbox((s) => ({ ...s, status: 'error', error: msg }))
      onError?.(msg)
    }
  }, [onError])

  const startDevServer = useCallback(async (sessionId: string) => {
    if (!mountedRef.current) return
    setSandbox((s) => ({ ...s, status: 'starting' }))

    try {
      const res = await fetch('/api/playground/sandbox/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, command: 'npm run dev', cwd: '/vercel/sandbox' }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      if (!mountedRef.current) return

      setSandbox((s) => ({ ...s, status: 'ready' }))
      setTerminalOutput((prev) => [...prev, `[dev server started] cmdId: ${data.cmdId}`])
    } catch (error) {
      if (!mountedRef.current) return
      const msg = error instanceof Error ? error.message : 'Failed to start dev server'
      setSandbox((s) => ({ ...s, status: 'error', error: msg }))
      onError?.(msg)
    }
  }, [onError])

  const executeTerminal = useCallback(async (command: string) => {
    if (!sandbox.sessionId || !command.trim()) return
    setTerminalOutput((prev) => [...prev, `$ ${command}`])
    setTerminalInput('')

    try {
      const res = await fetch('/api/playground/sandbox/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sandbox.sessionId, command: command.trim(), cwd: '/vercel/sandbox' }),
      })
      const data = await res.json()
      if (data.stdout) {
        setTerminalOutput((prev) => [...prev, data.stdout])
        onFilesChange?.([{ path: 'terminal-output', content: data.stdout }])
      }
      if (data.stderr) setTerminalOutput((prev) => [...prev, `[stderr] ${data.stderr}`])
      if (data.exitCode !== 0) setTerminalOutput((prev) => [...prev, `[exit ${data.exitCode}]`])
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Command failed'
      setTerminalOutput((prev) => [...prev, `[error] ${msg}`])
    }
  }, [sandbox.sessionId, onFilesChange])

  const handleTerminalKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      executeTerminal(terminalInput)
    }
  }, [executeTerminal, terminalInput])

  const performWrite = useCallback(async (sessionId: string, filesToWrite: SandboxFile[]) => {
    await writeFiles(sessionId, filesToWrite)
    if (!mountedRef.current) return

    const currentState = await new Promise<SandboxState>((resolve) => {
      setSandbox((s) => { resolve(s); return s })
    })

    if (currentState.status === 'installing' || currentState.status === 'writing') {
      await startDevServer(sessionId)
    }
  }, [writeFiles, startDevServer])

  useEffect(() => {
    if (files.length === 0 || isStreaming) return

    const filesKey = files.map((f) => `${f.path}:${f.content.length}`).join('|')
    if (filesKey === lastWrittenKeyRef.current) return

    if (writeTimerRef.current) clearTimeout(writeTimerRef.current)

    writeTimerRef.current = setTimeout(async () => {
      lastWrittenKeyRef.current = filesKey

      let sessionId = sandbox.sessionId
      if (!sessionId) {
        sessionId = await createSandbox()
        if (!sessionId) return
      }
      await performWrite(sessionId, files)
    }, WRITE_DEBOUNCE_MS)

    return () => { if (writeTimerRef.current) clearTimeout(writeTimerRef.current) }
  }, [files, isStreaming, sandbox.sessionId, createSandbox, performWrite])

  useEffect(() => {
    if (sandbox.status === 'idle' && files.length > 0 && !isStreaming) {
      lastWrittenKeyRef.current = ''

      const init = async () => {
        const sessionId = await createSandbox()
        if (sessionId) await performWrite(sessionId, files)
      }
      init()
    }
  }, [sandbox.status, files, isStreaming, createSandbox, performWrite])

  if (sandbox.status === 'idle' && files.length === 0) {
    return (
      <div className="h-full min-h-[488px] bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="text-[10px] uppercase tracking-widest text-orange-500">Full-Stack Mode</div>
          <h2 className="mt-3 text-3xl font-bold uppercase tracking-tighter">Real Server Preview</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Generate an app to see it run in a real Linux VM with Next.js, API routes, and database support.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
            <span className="border border-zinc-900 px-2 py-1">Next.js App Router</span>
            <span className="border border-zinc-900 px-2 py-1">API Routes</span>
            <span className="border border-zinc-900 px-2 py-1">Database</span>
            <span className="border border-zinc-900 px-2 py-1">Terminal</span>
          </div>
        </div>
      </div>
    )
  }

  if (sandbox.status === 'error') {
    return (
      <div className="h-full min-h-[488px] bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="text-[10px] uppercase tracking-widest text-red-500">VM Error</div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">{sandbox.error}</p>
          <button
            type="button"
            onClick={() => {
              setSandbox({ sessionId: null, name: null, previewUrl: null, status: 'idle', error: null })
              lastWrittenKeyRef.current = ''
            }}
            className="mt-4 border border-zinc-800 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (sandbox.status !== 'ready') {
    const statusMessages: Record<string, string> = {
      creating: 'Spinning up VM…',
      writing: 'Writing files…',
      installing: 'Installing packages…',
      starting: 'Starting dev server…',
      stopping: 'Stopping VM…',
    }
    return <SandboxLoading status={sandbox.status} message={statusMessages[sandbox.status]} name={sandbox.name} />
  }

  if (mode === 'terminal') {
    return (
      <div className="h-full min-h-[488px] bg-black text-white flex flex-col">
        <div className="border-b border-zinc-900 px-4 py-2 flex items-center justify-between">
          <StatusBadge status={sandbox.status} />
          <button
            type="button"
            onClick={stopSandbox}
            className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300"
          >
            Stop VM
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 font-mono text-xs">
          {terminalOutput.map((line, i) => (
            <div key={i} className={line.startsWith('$') ? 'text-orange-500' : 'text-zinc-300'}>{line}</div>
          ))}
        </div>
        <div className="border-t border-zinc-900 p-3">
          <div className="flex items-center gap-2">
            <span className="text-orange-500 text-xs">$</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              onKeyDown={handleTerminalKeyDown}
              placeholder="Enter command…"
              className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full min-h-[488px] bg-black flex flex-col">
      <div className="border-b border-zinc-900 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <StatusBadge status={sandbox.status} />
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-600">{sandbox.name}</span>
          <button
            type="button"
            onClick={stopSandbox}
            className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300"
          >
            Stop VM
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {sandbox.previewUrl ? (
          <iframe
            ref={iframeRef}
            src={sandbox.previewUrl}
            className="h-full w-full border-0"
            title="Full-Stack Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-600">
            <Spinner size={16} />
          </div>
        )}
      </div>
    </div>
  )
}
