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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
  SandpackConsole,
  SandpackFileExplorer,
  UnstyledOpenInCodeSandboxButton,
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

/** Extract npm dependencies from a generated package.json file. */
function extractDependencies(files: WorkbenchFile[]): Record<string, string> {
  const pkgFile = files.find((f) => f.path === 'package.json')
  if (!pkgFile) return {}
  try {
    const pkg = JSON.parse(pkgFile.content) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
    return { ...pkg.dependencies, ...pkg.devDependencies }
  } catch {
    return {}
  }
}

// Provided by Sandpack's react-ts template — never add these as deps.
const SANDPACK_PROVIDED = new Set([
  'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime',
])

// Known-good versions for the packages AI most often reaches for, so we don't
// gamble on `latest` for the common cases. Anything else falls back to latest.
const COMMON_DEP_VERSIONS: Record<string, string> = {
  'lucide-react': 'latest',
  'framer-motion': 'latest',
  'motion': 'latest',
  'clsx': 'latest',
  'classnames': 'latest',
  'tailwind-merge': 'latest',
  'class-variance-authority': 'latest',
  'recharts': 'latest',
  'date-fns': 'latest',
  'dayjs': 'latest',
  'zustand': 'latest',
  'immer': 'latest',
  'nanoid': 'latest',
  'uuid': 'latest',
  'zod': 'latest',
  'react-icons': 'latest',
  '@heroicons/react': 'latest',
  'react-router-dom': 'latest',
  'axios': 'latest',
  'swr': 'latest',
  '@tanstack/react-query': 'latest',
  'react-hook-form': 'latest',
  'chart.js': 'latest',
  'react-chartjs-2': 'latest',
  'three': 'latest',
  '@react-three/fiber': 'latest',
  '@react-three/drei': 'latest',
  'lodash': 'latest',
  'lodash-es': 'latest',
}

/**
 * Safety net: AI-generated apps frequently `import` a package without declaring
 * it in package.json. Sandpack only installs what's in `dependencies`, so those
 * imports fail to resolve and the preview breaks. Scan the source for bare
 * (non-relative) imports and ensure every package is present.
 */
function inferDependenciesFromImports(files: WorkbenchFile[]): Record<string, string> {
  const deps: Record<string, string> = {}
  const importRe = /(?:import\b[^'"]*?\bfrom\s*|import\s*|require\(\s*|import\(\s*)['"]([^'"]+)['"]/g
  for (const file of files) {
    if (!/\.(t|j)sx?$/.test(file.path)) continue
    let m: RegExpExecArray | null
    while ((m = importRe.exec(file.content)) !== null) {
      const spec = m[1]
      // Skip relative/absolute paths, path aliases (@/…, ~/…), and bare CSS.
      if (
        !spec ||
        spec.startsWith('.') ||
        spec.startsWith('/') ||
        spec.startsWith('@/') ||
        spec.startsWith('~') ||
        spec.endsWith('.css')
      )
        continue
      // Resolve to the package name (handle scoped + subpath imports).
      const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
      if (!name || SANDPACK_PROVIDED.has(name) || SANDPACK_PROVIDED.has(spec)) continue
      if (!deps[name]) deps[name] = COMMON_DEP_VERSIONS[name] ?? 'latest'
    }
  }
  return deps
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

  // Alias App.css → styles.css so `import './App.css'` resolves correctly
  if (out['/styles.css'] && !out['/App.css']) {
    out['/App.css'] = out['/styles.css']
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
      // Keep App.css alias in sync with styles.css
      if (path === '/styles.css') {
        const alias = sandpackRef.current.files['/App.css']
        if (alias && alias.code !== file.content) {
          sandpackRef.current.updateFile('/App.css', file.content)
        }
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

/** Overlay that shows rotating verbs until Sandpack reports the preview is running.
 *  Stays visible for at least 3 seconds so users can read the status messages. */
function BootOverlay() {
  const { sandpack } = useSandpack()
  const [verb, setVerb] = useState(0)
  const [hidden, setHidden] = useState(false)
  const booting = sandpack.status === 'initial' || sandpack.status === 'idle'

  useEffect(() => {
    if (!booting) {
      // Keep overlay visible for 2 more seconds after Sandpack finishes booting
      const hideTimer = setTimeout(() => setHidden(true), 2000)
      return () => clearTimeout(hideTimer)
    }
    setHidden(false)
    const id = setInterval(() => setVerb((v) => v + 1), 2000)
    return () => clearInterval(id)
  }, [booting])

  if (!booting && hidden) return null

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

export type ErrorInfo = {
  message: string
  filePath?: string
  line?: number
}

/** Surfaces compile/runtime errors for the AI fix loop with file + line context.
 *  Suppressed entirely while files are streaming to prevent red flash on
 *  transient compile errors (missing imports during partial file updates). */
function ErrorReporter({ onError, isStreaming }: { onError?: (error: ErrorInfo | null) => void; isStreaming: boolean }) {
  const { sandpack } = useSandpack()
  const message = sandpack.error?.message ?? null
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const errorInfo = useMemo<ErrorInfo | null>(() => {
    if (!message) return null
    return {
      message,
      filePath: sandpack.error?.path,
      line: sandpack.error?.line,
    }
  }, [message, sandpack.error?.path, sandpack.error?.line])

  useEffect(() => {
    // Suppress all errors while files are streaming — every partial update
    // causes transient "missing module" errors that flash the UI.
    if (isStreaming) {
      onError?.(null)
      if (settleTimer.current) clearTimeout(settleTimer.current)
      return
    }

    // After streaming stops, wait 2s for the sandbox to settle before
    // reporting any persistent errors.
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      onError?.(errorInfo)
    }, 2000)

    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current)
    }
  }, [errorInfo, isStreaming, onError])

  return null
}

interface SandpackWorkbenchProps {
  /** Identity key — change to remount with fresh files (e.g. project switch) */
  generationKey: string
  files: WorkbenchFile[]
  mode: 'preview' | 'code'
  activeFile?: string
  showConsole?: boolean
  isStreaming?: boolean
  onFilesChange?: (files: { path: string; content: string }[]) => void
  onError?: (error: ErrorInfo | null) => void
}

export default function SandpackWorkbench({
  generationKey,
  files,
  mode,
  activeFile,
  showConsole,
  isStreaming = false,
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

  // Merge declared package.json deps with deps inferred from actual imports.
  // Declared versions win (an explicit version is intentional); inferred fills
  // the common gap where the AI imports a package it forgot to declare.
  const dependencies = useMemo(
    () => ({ ...inferDependenciesFromImports(files), ...extractDependencies(files) }),
    [generationKey],
  )

  const active = activeFile ? toSandpackPath(activeFile) : null

  return (
    <SandpackProvider
      key={generationKey}
      template="react-ts"
      theme={agentbotTheme}
      files={{
        ...initialFiles,
        // Suppress react-error-overlay — it causes red flash on transient errors
        '/styles.css': {
          code: `${initialFiles['/styles.css']?.code || ''}\n\n/* Suppress react-error-overlay red flash */\niframe[id*="react-error-overlay"] { display: none !important; }\n#react-error-overlay { display: none !important; }\n`,
        },
      }}
      customSetup={{
        dependencies,
      }}
      options={{
        activeFile: mode === 'code' ? (active ?? '/App.tsx') : undefined,
        autorun: true,
        autoReload: true,
        recompileMode: 'delayed',
        recompileDelay: 600,
        bundlerTimeOut: 60_000,
      }}
    >
      <FileUpdater files={files} />
      <EditSync onFilesChange={onFilesChange} />
      <ErrorReporter onError={onError} isStreaming={isStreaming} />
      {mode === 'preview' ? (
        <div className="relative flex h-full min-h-[488px] flex-col">
          <BootOverlay />
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton
            showRestartButton={false}
            showSandpackErrorOverlay={false}
            className="!h-full !min-h-[420px] flex-1"
          />
          {showConsole && (
            <div className="h-[180px] border-t border-zinc-900">
              <SandpackConsole resetOnPreviewRestart className="!h-full" />
            </div>
          )}
        </div>
      ) : (
        <SandpackLayout>
          <SandpackFileExplorer autoHiddenFiles className="!h-full !min-h-[488px] !w-[200px] !flex-none" />
          <div className="flex flex-1 flex-col">
            <SandpackCodeEditor
              showTabs
              showLineNumbers
              showInlineErrors
              wrapContent
              closableTabs={false}
              initMode="user-visible"
              className="!h-full !min-h-[488px] flex-1"
            />
            <div className="border-t border-zinc-900 p-2">
              <UnstyledOpenInCodeSandboxButton className="w-full border border-zinc-800 px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-400 hover:border-zinc-600 hover:text-white">
                Open in CodeSandbox ↗
              </UnstyledOpenInCodeSandboxButton>
            </div>
          </div>
        </SandpackLayout>
      )}
    </SandpackProvider>
  )
}
