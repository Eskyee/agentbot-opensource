/**
 * SandpackWorkbench — real in-browser build of the generated app.
 *
 * Replaces the old static `previewHtml` iframe: the actual src/App.tsx and
 * src/index.css are bundled and run live via Sandpack's react-ts template,
 * with an editable code editor (hot reload) and a real runtime console.
 *
 * File mapping (Vite project ⇄ Sandpack react-ts template):
 *   src/App.tsx   ⇄ /App.tsx
 *   src/index.css ⇄ /styles.css
 * Scaffold files (package.json, vite.config.ts, tsconfig…) are deployment
 * concerns — they're excluded from the in-browser bundle but still ship
 * unchanged on publish/download/GitLawb push.
 */
'use client'

import { useEffect, useRef } from 'react'
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

const APP_PATH = 'src/App.tsx'
const CSS_PATH = 'src/index.css'

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
  const app = files.find((f) => f.path === APP_PATH)?.content
  const css = files.find((f) => f.path === CSS_PATH)?.content

  return {
    '/App.tsx': { code: app ?? 'export default function App() {\n  return <p>Generate an app to start.</p>\n}\n' },
    '/styles.css': { code: css ?? '' },
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
}

/** Pushes editor changes back up so publish/download use the edited source. */
function EditSync({ onFilesChange }: { onFilesChange?: (files: { path: string; content: string }[]) => void }) {
  const { sandpack } = useSandpack()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const last = useRef<string>('')

  const app = sandpack.files['/App.tsx']?.code ?? ''
  const css = sandpack.files['/styles.css']?.code ?? ''

  useEffect(() => {
    if (!onFilesChange) return
    const signature = `${app.length}:${css.length}:${app.slice(-40)}${css.slice(-40)}`
    if (signature === last.current) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      last.current = signature
      onFilesChange([
        { path: APP_PATH, content: app },
        { path: CSS_PATH, content: css },
      ])
    }, 900)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [app, css, onFilesChange])

  return null
}

interface SandpackWorkbenchProps {
  /** Identity key — change to remount with fresh files (e.g. after AI regen) */
  generationKey: string
  files: WorkbenchFile[]
  mode: 'preview' | 'code'
  showConsole?: boolean
  onFilesChange?: (files: { path: string; content: string }[]) => void
}

export default function SandpackWorkbench({
  generationKey,
  files,
  mode,
  showConsole,
  onFilesChange,
}: SandpackWorkbenchProps) {
  return (
    <SandpackProvider
      key={generationKey}
      template="react-ts"
      theme={agentbotTheme}
      files={toSandpackFiles(files)}
      options={{
        activeFile: mode === 'code' ? '/App.tsx' : undefined,
        autorun: true,
        autoReload: true,
        recompileMode: 'delayed',
        recompileDelay: 600,
      }}
    >
      <EditSync onFilesChange={onFilesChange} />
      {mode === 'preview' ? (
        <div className="flex h-full min-h-[488px] flex-col">
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton
            showRestartButton={false}
            className="!h-full !min-h-[420px] flex-1"
          />
          {showConsole && (
            <div className="h-[160px] border-t border-zinc-900">
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
