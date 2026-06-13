/**
 * SandpackWorkbench — real in-browser build of the generated app.
 *
 * The actual src/* files are bundled and run live via Sandpack's react-ts
 * template, with an editable code editor (hot reload) and a real runtime
 * console. Files stream in live during generation (FileUpdater applies prop
 * changes via sandpack.updateFile), edits flow back out (EditSync), and
 * compile/runtime errors surface through onError for the AI fix loop.
 *
 * File mapping (Vite project ⇄ Sandpack react-ts template):
 *   src/App.tsx            ⇄ /App.tsx
 *   src/index.css          ⇄ /styles.css
 *   src/components/X.tsx   ⇄ /components/X.tsx
 *   src/hooks|lib/x.ts     ⇄ /hooks|lib/x.ts
 *   src/extra.css          ⇄ /extra.css
 * Scaffold files (package.json, vite.config.ts, tsconfig…) are deployment
 * concerns — excluded from the in-browser bundle but shipped on publish.
 */
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  SandpackProvider,
  SandpackPreview,
  SandpackCodeEditor,
  SandpackConsole,
  useSandpack,
  type SandpackTheme,
} from '@codesandbox/sandpack-react'

export type WorkbenchFile = {
  path: string
  language: string
  content: string
}

const BUNDLED_RE = /^src\/(?:App\.tsx|index\.css|(?:components|hooks|lib)\/[A-Za-z0-9_-]+\.(?:tsx|ts|css)|[A-Za-z0-9_-]+\.css)$/

function toSandpackPath(path: string): string | null {
  if (!BUNDLED_RE.test(path)) return null
  if (path === 'src/App.tsx') return '/App.tsx'
  if (path === 'src/index.css') return '/styles.css'
  return `/${path.slice('src/'.length)}`
}

function fromSandpackPath(path: string): string | null {
  if (path === '/App.tsx') return 'src/App.tsx'
  if (path === '/styles.css') return 'src/index.css'
  if (path === '/index.tsx') return null
  return `src${path}`
}

/** Brand theme — black base, zinc scale, orange accent, mono type. */
const agentbotTheme: SandpackTheme = {
  colors: {
    surface1: '#000000',
    surface2: '#09090b',
    surface3: '#18181b',
    clickable: '#a1a1aa',
    base: '#e4e4e7',
    disabled: '#52525b',
    hover: '#ffffff',
    accent: '#EF6F2E',
    error: '#ef4444',
    errorSurface: '#2a0a0a',
  },
  syntax: {
    plain: '#e4e4e7',
    comment: { color: '#52525b', fontStyle: 'italic' },
    keyword: '#EF6F2E',
    tag: '#f9a96a',
    punctuation: '#a1a1aa',
    definition: '#fafafa',
    property: '#7dd3fc',
    static: '#fbc9a0',
    string: '#86efac',
  },
  font: {
    body: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    size: '12px',
    lineHeight: '1.6',
  },
}

function toSandpackFiles(files: WorkbenchFile[]) {
  const out: Record<string, { code: string; hidden?: boolean }> = {
    '/index.tsx': {
      code: [
        "import React from 'react'",
        "import { createRoot } from 'react-dom/client'",
        "import './styles.css'",
        "import App from './App'",
        '',
        "createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)",
        '',
      ].join('\n'),
      hidden: true,
    },
  }

  for (const file of files) {
    const path = toSandpackPath(file.path)
    if (path) out[path] = { code: file.content }
  }

  if (!out['/App.tsx']) {
    out['/App.tsx'] = { code: 'export default function App() {\n  return <p style={{ fontFamily: "monospace", padding: 24 }}>Generate an app to start.</p>\n}\n' }
  }
  if (!out['/styles.css']) {
    out['/styles.css'] = { code: '' }
  }

  return out
}

/** Applies external file changes (e.g. streaming generation) into the running sandbox. */
function FileUpdater({ files }: { files: WorkbenchFile[] }) {
  const { sandpack } = useSandpack()
  const sandpackRef = useRef(sandpack)
  sandpackRef.current = sandpack

  useEffect(() => {
    for (const file of files) {
      const path = toSandpackPath(file.path)
      if (!path) continue
      const existing = sandpackRef.current.files[path]?.code
      if (existing !== file.content) {
        sandpackRef.current.updateFile(path, file.content)
      }
    }
  }, [files])

  return null
}

/** Pushes editor changes back up so publish/download use the edited source. */
function EditSync({ onFilesChange }: { onFilesChange?: (files: { path: string; content: string }[]) => void }) {
  const { sandpack } = useSandpack()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const last = useRef<string>('')

  const signature = useMemo(
    () =>
      Object.entries(sandpack.files)
        .map(([path, file]) => `${path}:${file.code.length}:${file.code.slice(-24)}`)
        .join('|'),
    [sandpack.files],
  )

  useEffect(() => {
    if (!onFilesChange) return
    if (signature === last.current) return
    if (timer.current) clearTimeout(timer.current)
    const filesSnapshot = sandpack.files
    timer.current = setTimeout(() => {
      last.current = signature
      const out: { path: string; content: string }[] = []
      for (const [path, file] of Object.entries(filesSnapshot)) {
        const projectPath = fromSandpackPath(path)
        if (projectPath) out.push({ path: projectPath, content: file.code })
      }
      if (out.length > 0) onFilesChange(out)
    }, 900)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, onFilesChange])

  return null
}

// Claude-style "thinking" verbs shown while the live preview boots/bundles.
const BOOT_VERBS = [
  'Spinning up the sandbox',
  'Installing dependencies',
  'Transpiling components',
  'Wiring up React',
  'Bundling modules',
  'Resolving imports',
  'Warming the preview',
  'Painting first frame',
  'Almost there',
]

/** Overlay that shows rotating verbs until Sandpack reports the preview is running. */
function BootOverlay() {
  const { sandpack } = useSandpack()
  const [verb, setVerb] = useState(0)
  const booting = sandpack.status === 'initial' || sandpack.status === 'idle'

  useEffect(() => {
    if (!booting) return
    const id = setInterval(() => setVerb((v) => v + 1), 1400)
    return () => clearInterval(id)
  }, [booting])

  if (!booting) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="text-center">
        <div className="mx-auto mb-4 h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-orange-500" aria-live="polite">
          {BOOT_VERBS[verb % BOOT_VERBS.length]}…
        </div>
      </div>
    </div>
  )
}

/** Surfaces compile/runtime errors for the AI fix loop. */
function ErrorReporter({ onError }: { onError?: (message: string | null) => void }) {
  const { sandpack } = useSandpack()
  const message = sandpack.error?.message ?? null

  useEffect(() => {
    onError?.(message)
  }, [message, onError])

  return null
}

interface SandpackWorkbenchProps {
  /** Identity key — change to remount with fresh files (e.g. project switch) */
  generationKey: string
  files: WorkbenchFile[]
  mode: 'preview' | 'code'
  activeFile?: string
  showConsole?: boolean
  onFilesChange?: (files: { path: string; content: string }[]) => void
  onError?: (message: string | null) => void
}

export default function SandpackWorkbench({
  generationKey,
  files,
  mode,
  activeFile,
  showConsole,
  onFilesChange,
  onError,
}: SandpackWorkbenchProps) {
  const initialFiles = useMemo(
    () => toSandpackFiles(files),
    // Only rebuild the initial file map when the workbench identity changes —
    // live updates flow through FileUpdater without remounting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generationKey],
  )

  const active = activeFile ? toSandpackPath(activeFile) : null

  return (
    <SandpackProvider
      key={generationKey}
      template="react-ts"
      theme={agentbotTheme}
      files={initialFiles}
      options={{
        activeFile: mode === 'code' ? (active ?? '/App.tsx') : undefined,
        autorun: true,
        autoReload: true,
        recompileMode: 'delayed',
        recompileDelay: 600,
        // Generous bundler timeout — the hosted bundler can be slow on cold start
        bundlerTimeOut: 60_000,
      }}
    >
      <FileUpdater files={files} />
      <EditSync onFilesChange={onFilesChange} />
      <ErrorReporter onError={onError} />
      {mode === 'preview' ? (
        <div className="relative flex h-full min-h-[488px] flex-col">
          <BootOverlay />
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton
            showRestartButton={false}
            className="!h-full !min-h-[420px] flex-1"
          />
          {showConsole && (
            <div className="h-[180px] border-t border-zinc-900">
              <SandpackConsole resetOnPreviewRestart className="!h-full" />
            </div>
          )}
        </div>
      ) : (
        <SandpackCodeEditor
          showTabs
          showLineNumbers
          showInlineErrors
          wrapContent
          closableTabs={false}
          className="!h-full !min-h-[488px]"
        />
      )}
    </SandpackProvider>
  )
}
