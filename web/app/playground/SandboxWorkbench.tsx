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
  onError?: (error: string) => void
}

type SandboxState = {
  sessionId: string | null
  name: string | null
  previewUrl: string | null
  status: 'idle' | 'creating' | 'writing' | 'installing' | 'starting' | 'ready' | 'error'
  error: string | null
}

const WRITE_DEBOUNCE_MS = 800

export default function SandboxWorkbench({
  generationKey,
  files,
  mode,
  isStreaming,
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

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const createSandbox = useCallback(async (): Promise<string | null> => {
    if (!mountedRef.current) return null
    setSandbox((s) => ({ ...s, status: 'creating', error: null }))

    try {
      const res = await fetch('/api/playground/sandbox/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runtime: 'node24', ports: [3000] }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
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
  }, [onError])

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
      if (data.stdout) setTerminalOutput((prev) => [...prev, data.stdout])
      if (data.stderr) setTerminalOutput((prev) => [...prev, `[stderr] ${data.stderr}`])
      if (data.exitCode !== 0) setTerminalOutput((prev) => [...prev, `[exit ${data.exitCode}]`])
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Command failed'
      setTerminalOutput((prev) => [...prev, `[error] ${msg}`])
    }
  }, [sandbox.sessionId])

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
    }
    return (
      <div className="h-full min-h-[488px] bg-black text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <Spinner size={24} />
          <div className="mt-4 text-[10px] uppercase tracking-widest text-orange-500">
            {statusMessages[sandbox.status] || 'Loading…'}
          </div>
          {sandbox.name && (
            <div className="mt-2 text-[10px] uppercase tracking-widest text-zinc-600">{sandbox.name}</div>
          )}
        </div>
      </div>
    )
  }

  if (mode === 'terminal') {
    return (
      <div className="h-full min-h-[488px] bg-black text-white flex flex-col">
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
    <div className="h-full min-h-[488px] bg-black">
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
  )
}
