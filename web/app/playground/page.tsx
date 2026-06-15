'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Archive,
  Check,
  ChevronDown,
  Code2,
  Columns3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  Layout,
  Maximize2,
  Minus,
  Monitor,
  Music,
  Plus,
  RotateCw,
  Send,
  Smartphone,
  Tablet,
  Terminal,
  X,
} from 'lucide-react'
import { Spinner } from '@/app/components/ui/spinner'
import { Kbd } from '@/app/components/ui/kbd'

// Sandpack is heavy — load it client-side only, when the builder renders.
const SandpackWorkbench = dynamic(() => import('./SandpackWorkbench'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[488px] items-center justify-center bg-black text-[10px] uppercase tracking-widest text-zinc-600">
      Booting live preview…
    </div>
  ),
})

// Vercel Sandbox workbench — also heavy, load client-side only.
const SandboxWorkbench = dynamic(() => import('./SandboxWorkbench'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[488px] items-center justify-center bg-black text-[10px] uppercase tracking-widest text-zinc-600">
      Booting Vercel Sandbox…
    </div>
  ),
})

type PlaygroundFile = {
  path: string
  language: string
  content: string
}

type PlaygroundGeneration = {
  title: string
  summary: string
  previewHtml: string
  files: PlaygroundFile[]
  console: string[]
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  at: number
}

type PlaygroundProject = {
  id: string
  name: string
  status: 'IDLE' | 'PUBLISHED' | 'ARCHIVED'
  template: string
  lastActive: string
  publishedUrl?: string
  deploymentProvider?: string
  deploymentId?: string
  deploymentState?: string
  generation: PlaygroundGeneration | null
  executionMode?: ExecutionMode
  messages?: ChatMessage[]
  history?: GenerationSnapshot[]
}

type GenerationSnapshot = {
  at: number
  label: string
  generation: PlaygroundGeneration
}

const MAX_HISTORY = 20

type PlaygroundResponse = {
  provider: string
  model: string
  generation: PlaygroundGeneration
  usage?: { remaining: number; limit: number }
}

type PlaygroundProjectsResponse = {
  projects: PlaygroundProject[]
  storage: 'server'
}

const STORAGE_KEY = 'agentbot:openclaude-playground:projects:v1'

type Template = {
  id: string
  title: string
  description: string
  category: 'landing' | 'dashboard' | 'tool' | 'portfolio' | 'agent'
  icon: typeof Layout
  prompt: string
  tags: string[]
}

const TEMPLATES: Template[] = [
  {
    id: 'scout-agent',
    title: 'Scout — Research Agent',
    description: 'Autonomous research dashboard. Web scraping, competitor monitoring, briefing reports.',
    category: 'agent',
    icon: Terminal,
    prompt: 'Build a research agent dashboard in src/App.tsx. Header with agent status (Running/Idle). Three panels: a search input with results list, a briefing generator that shows structured reports, and a monitoring feed with live updates. Include sample research data. Dark theme with green status accents.',
    tags: ['research', 'monitoring', 'agent'],
  },
  {
    id: 'promoter-agent',
    title: 'Promoter — Social Agent',
    description: 'Social media management. Content scheduling, post drafting, engagement tracking.',
    category: 'agent',
    icon: Globe2,
    prompt: 'Build a social media promoter dashboard in src/App.tsx. Content calendar grid showing scheduled posts, a post composer with platform toggles (Twitter/Instagram/LinkedIn), engagement metrics cards (likes, shares, comments), and a draft queue. Dark theme with platform-specific accent colors.',
    tags: ['social', 'marketing', 'agent'],
  },
  {
    id: 'booker-agent',
    title: 'Booker — Finance Agent',
    description: 'Bookings, invoicing, payments. Autonomous royalty splits via Base wallets.',
    category: 'agent',
    icon: FileText,
    prompt: 'Build a bookings and finance agent dashboard in src/App.tsx. Booking calendar with upcoming events, an invoice generator with line items and totals, a payment history table with status badges (Paid/Pending/Overdue), and a wallet balance card showing USDC on Base. Dark theme with orange accents.',
    tags: ['finance', 'bookings', 'agent'],
  },
  {
    id: 'dj-agent',
    title: 'DJ — Live Radio Agent',
    description: 'Autonomous AI DJ. Streams 24/7, reactive track selection, community vibes.',
    category: 'agent',
    icon: Music,
    prompt: 'Build a live DJ dashboard in src/App.tsx. Now playing card with track info and waveform, queue of upcoming tracks, listener count, a BPM mixer panel with tempo controls, and a chat feed. Dark theme with neon purple/green accents. Include sample track data.',
    tags: ['music', 'streaming', 'agent'],
  },
  {
    id: 'analyst-agent',
    title: 'Analyst — Data Agent',
    description: 'Metrics tracking, trend analysis, automated reports. Token usage and costs.',
    category: 'agent',
    icon: Monitor,
    prompt: 'Build a data analyst dashboard in src/App.tsx. KPI cards with sparklines, a bar chart for daily metrics, a line chart for trend analysis, a data table with sorting, and an export button. Seed with 30 days of sample data. Dark theme with blue accent colors.',
    tags: ['analytics', 'data', 'agent'],
  },
  {
    id: 'ai-landing',
    title: 'AI Startup Landing',
    description: 'Hero, features, pricing tiers, testimonials, footer. Dark theme with gradients.',
    category: 'landing',
    icon: Layout,
    prompt: 'Build a landing page in src/App.tsx for an AI infrastructure startup. Hero with gradient backdrop, three feature cards, a pricing table with three tiers (Free / Pro / Enterprise), a testimonials row, and a footer. Dark theme with subtle gradients in src/index.css. Keep it semantic and accessible.',
    tags: ['marketing', 'startup', 'dark'],
  },
  {
    id: 'saas-pricing',
    title: 'SaaS Pricing Page',
    description: 'Three-tier pricing with feature comparison, FAQ accordion, CTA.',
    category: 'landing',
    icon: Layout,
    prompt: 'Build a SaaS pricing page in src/App.tsx with three tiers. Feature comparison grid, toggle for monthly/annual with discount, FAQ accordion with 4 questions, and a prominent CTA button. Clean dark theme with accent color on the popular tier.',
    tags: ['pricing', 'saas', 'conversion'],
  },
  {
    id: 'crm-pipeline',
    title: 'Pipeline CRM',
    description: '4-column Kanban, drag-and-drop cards, activity feed, search.',
    category: 'dashboard',
    icon: Monitor,
    prompt: 'Build a lightweight CRM dashboard in src/App.tsx with a 4-column Kanban pipeline (Lead -> Qualified -> Proposal -> Closed), drag-to-move cards using the HTML5 Drag and Drop API, an activity feed sidebar, and a search input that filters cards. Seed 8-10 realistic sample contacts.',
    tags: ['business', 'kanban', 'drag-drop'],
  },
  {
    id: 'crypto-portfolio',
    title: 'Crypto Portfolio',
    description: 'Token holdings, price cards, allocation bar, transaction history.',
    category: 'dashboard',
    icon: Monitor,
    prompt: 'Build a crypto portfolio tracker in src/App.tsx. Header with total balance and 24h change. Grid of token cards (ETH, USDC, BTC, SOL) with price and holding value. A simple allocation bar chart. Transaction history list with type (buy/sell), amount, and timestamp. Dark theme.',
    tags: ['crypto', 'finance', 'web3'],
  },
  {
    id: 'habit-tracker',
    title: 'Habit Tracker',
    description: 'Daily check-ins, 7-day streak visualization, weekly stats.',
    category: 'tool',
    icon: Check,
    prompt: 'Build a single-page habit tracker in src/App.tsx with daily check-ins for 5 sample habits, a 7-day streak visualization (colored squares), and a weekly stats panel. Persist state to localStorage. Use React hooks; style in src/index.css.',
    tags: ['productivity', 'personal', 'hooks'],
  },
  {
    id: 'invoice-generator',
    title: 'Invoice Generator',
    description: 'Line items, totals, VAT calc, PDF-ready layout. For freelancers.',
    category: 'tool',
    icon: FileText,
    prompt: 'Build an invoice generator in src/App.tsx. Form with client name/email, dynamic line items (description, quantity, rate), auto-calculated subtotal/VAT/total. A live invoice preview panel on the right with professional formatting. Add/remove line items dynamically. Dark theme.',
    tags: ['business', 'freelancer', 'forms'],
  },
  {
    id: 'chat-interface',
    title: 'Chat Interface',
    description: 'Messaging UI with bubbles, typing indicator, message input.',
    category: 'tool',
    icon: Send,
    prompt: 'Build a chat interface in src/App.tsx. Message list with sent/received bubbles (different colors), timestamps, a typing indicator animation, and a message input with send button. Seed with 8 sample messages. Use React state for sending new messages that appear instantly.',
    tags: ['messaging', 'ui', 'animation'],
  },
  {
    id: 'designer-portfolio',
    title: 'Designer Portfolio',
    description: 'Hero, case studies, work gallery, contact form with validation.',
    category: 'portfolio',
    icon: Globe2,
    prompt: 'Build a portfolio site in src/App.tsx for a product designer. Hero, three case-study cards with hover states, a selected-work gallery (CSS grid), and a contact form that validates email format and shows inline errors. Sans-serif typography, warm neutrals.',
    tags: ['creative', 'portfolio', 'form'],
  },
]

const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'agent', label: 'Agent' },
  { id: 'landing', label: 'Landing' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tool', label: 'Tool' },
  { id: 'portfolio', label: 'Portfolio' },
] as const

const VIEWPORTS = {
  mobile: 'w-[390px]',
  tablet: 'w-[820px]',
  desktop: 'w-full',
  fill: 'w-full',
} as const

const PLAYGROUND_PROMISE = 'Build and publish Vite + React apps with OpenClaude, Xiaomi MiMo, and Agentbot gateway routing.'

type Viewport = keyof typeof VIEWPORTS
type Pane = 'preview' | 'code' | 'terminal'
type View = 'builder' | 'templates' | 'apps' | 'projects' | 'publish' | 'history'
type ExecutionMode = 'sandpack' | 'sandbox'
type ConsoleLevel = 'all' | 'error' | 'warn' | 'log'
type ConsoleEntry = {
  level: Exclude<ConsoleLevel, 'all'>
  message: string
}

function createId(prefix = 'project') {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`
}

function createSessionId() {
  const left = Math.random().toString(16).slice(2, 5).toUpperCase()
  const right = Math.random().toString(16).slice(2, 6).toUpperCase()
  return `${left}-${right}`
}

function defaultProjects(): PlaygroundProject[] {
  return [
    {
      id: 'untitled-active',
      name: 'untitled',
      status: 'IDLE',
      template: 'VITE-REACT-TS',
      lastActive: 'never',
      generation: null,
    },
  ]
}

const MODEL_OPTIONS = [
  { value: 'xiaomi/mimo-v2.5-pro', label: 'MiMo V2.5 Pro' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o mini' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
] as const

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}b`
  return `${(bytes / 1024).toFixed(1)}kb`
}

function fileLabel(path: string) {
  return path.split('/').pop()?.toUpperCase() || path.toUpperCase()
}

function externalUrl(value?: string | null) {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value.replace(/^\/+/, '')}`
}

// Rotating verbs shown while OpenClaude builds — keeps the wait alive.
const SPINNER_VERBS = [
  'Observing', 'Hill-climbing', 'Reverse-engineering', 'Verifying', 'Pressure-testing',
  'Iterating', 'Decomposing', 'Pattern-matching', 'Weaving', 'Shaping', 'Binding',
  'Leveling up', 'Cultivating', 'Ascending', 'Looting', 'Min-maxing', 'Grinding XP',
  'Skill-checking', 'Boss-fighting', 'Jacking in', 'Console-cowboying', 'Neuromancing',
  'Metaversing', 'Tessering', 'Folding space', 'Warp-driving', 'Making it so',
  'Boldly going', 'Replicating', 'Holodeck-running', 'Grokking', 'Foundation-building',
  'Psychohistorying', 'Bullet-timing', 'Interstellaring', 'Spiraling-out', 'Evolving',
  'World-modeling', 'Context-engineering', 'Next-token-predicting', 'Summarizing',
  'Parallelizing', 'Agent-spawning', 'Delegating', 'Caffeinating', 'Kerning',
  'Flow-stating', 'Kaizen-improving', 'Samurai-coding', 'Spell-weaving', 'Rune-carving',
  'Quest-completing', 'Achievement-unlocking', 'Speed-running', 'Git-pushing',
  'Branch-merging', 'TypeScript-compiling', 'Rubber-duck-debugging', 'Yak-shaving',
  'Ship-it-squirreling', 'Gradient-descending', 'Attention-heading', 'Tokenizing',
  'Latent-space-traversing', 'Diffusion-denoising', 'Beam-searching', 'Fine-tuning',
  'Stormlight-archiving', 'Shardblade-summoning', 'Bridge-four-running', 'OASIS-logging-in',
] as const

function buildConsoleEntries(generation: PlaygroundGeneration | null, error: string | null, isGenerating: boolean): ConsoleEntry[] {
  const entries: ConsoleEntry[] = []

  if (isGenerating) {
    entries.push({ level: 'log', message: 'booting sandbox' })
    entries.push({ level: 'log', message: 'spinning up session machine' })
    entries.push({ level: 'log', message: 'applying changes' })
  }

  if (error) {
    entries.push({ level: 'error', message: error })
  }

  for (const line of generation?.console ?? []) {
    const lower = line.toLowerCase()
    const level: ConsoleEntry['level'] = lower.includes('error')
      ? 'error'
      : lower.includes('warn')
        ? 'warn'
        : 'log'
    entries.push({ level, message: line })
  }

  return entries
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'untitled'
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1)
  }
  return value >>> 0
})

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeUint16(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff)
}

function writeUint32(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff)
}

function createZip(files: PlaygroundFile[]) {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  const centralDirectory: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const name = encoder.encode(file.path)
    const data = encoder.encode(file.content)
    const checksum = crc32(data)
    const localHeader: number[] = []

    writeUint32(localHeader, 0x04034b50)
    writeUint16(localHeader, 20)
    writeUint16(localHeader, 0)
    writeUint16(localHeader, 0)
    writeUint16(localHeader, 0)
    writeUint16(localHeader, 0)
    writeUint32(localHeader, checksum)
    writeUint32(localHeader, data.length)
    writeUint32(localHeader, data.length)
    writeUint16(localHeader, name.length)
    writeUint16(localHeader, 0)

    const localChunk = new Uint8Array([...localHeader, ...name, ...data])
    chunks.push(localChunk)

    const centralHeader: number[] = []
    writeUint32(centralHeader, 0x02014b50)
    writeUint16(centralHeader, 20)
    writeUint16(centralHeader, 20)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint32(centralHeader, checksum)
    writeUint32(centralHeader, data.length)
    writeUint32(centralHeader, data.length)
    writeUint16(centralHeader, name.length)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint16(centralHeader, 0)
    writeUint32(centralHeader, 0)
    writeUint32(centralHeader, offset)
    centralDirectory.push(new Uint8Array([...centralHeader, ...name]))

    offset += localChunk.length
  }

  const centralDirectoryOffset = offset
  for (const chunk of centralDirectory) {
    chunks.push(chunk)
    offset += chunk.length
  }

  const end: number[] = []
  writeUint32(end, 0x06054b50)
  writeUint16(end, 0)
  writeUint16(end, 0)
  writeUint16(end, files.length)
  writeUint16(end, files.length)
  writeUint32(end, offset - centralDirectoryOffset)
  writeUint32(end, centralDirectoryOffset)
  writeUint16(end, 0)
  chunks.push(new Uint8Array(end))

  return new Blob(chunks.map((chunk) => chunk.slice()) as BlobPart[], { type: 'application/zip' })
}

async function fetchServerProjects(): Promise<PlaygroundProject[] | null> {
  const response = await fetch('/api/playground/projects', { cache: 'no-store' })
  if (response.status === 401) return null
  if (!response.ok) throw new Error('Failed to load server projects')

  const data = await response.json() as PlaygroundProjectsResponse
  return Array.isArray(data.projects) ? data.projects : []
}

async function persistServerProject(
  project: PlaygroundProject,
  extra: { prompt?: string; provider?: string; model?: string } = {},
): Promise<PlaygroundProject | null> {
  const response = await fetch(`/api/playground/projects/${encodeURIComponent(project.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...project, ...extra }),
  })

  if (response.status === 401) return null
  if (!response.ok) throw new Error('Failed to save playground project')

  const data = await response.json() as { project?: PlaygroundProject }
  return data.project ?? null
}

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState('')
  const [projects, setProjects] = useState<PlaygroundProject[]>(() => defaultProjects())
  const [activeProjectId, setActiveProjectId] = useState('untitled-active')
  const [provider, setProvider] = useState('openclaude')
  const [model, setModel] = useState('xiaomi/mimo-v2.5-pro')
  const [autoApprove, setAutoApprove] = useState(true)
  const [selectedFile, setSelectedFile] = useState('.gitignore')
  const [pane, setPane] = useState<Pane>('preview')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [view, setView] = useState<View>('builder')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isRefreshingPublish, setIsRefreshingPublish] = useState(false)
  const [isPushingGitlawb, setIsPushingGitlawb] = useState(false)
  const [isSandboxing, setIsSandboxing] = useState(false)
  const [sandboxUrl, setSandboxUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showEmailCapture, setShowEmailCapture] = useState(false)
  const [emailCaptureSent, setEmailCaptureSent] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState('LOCAL')
  const [hydrated, setHydrated] = useState(false)
  const [storage, setStorage] = useState<'local' | 'server'>('local')
  const [shareCopied, setShareCopied] = useState(false)
  const [makingAgent, setMakingAgent] = useState(false)
  const [agentMade, setAgentMade] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [agentLink, setAgentLink] = useState<string | null>(null)
  // Bumped to force the live workbench to remount after a history restore
  const [restoreNonce, setRestoreNonce] = useState(0)
  // Execution mode: Sandpack (in-browser) or Vercel Sandbox (full-stack VM)
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('sandpack')
  const [sandboxName, setSandboxName] = useState<string | null>(null)

  useEffect(() => {
    setSessionId(createSessionId())

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        setHydrated(true)
        return
      }

      const parsed = JSON.parse(saved) as { projects?: PlaygroundProject[]; activeProjectId?: string }
      if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        setProjects(parsed.projects)
        setActiveProjectId(parsed.activeProjectId || parsed.projects[0]?.id || 'untitled-active')
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    } finally {
      setHydrated(true)
    }

    void fetchServerProjects()
      .then((serverProjects) => {
        if (!serverProjects || serverProjects.length === 0) return
        setProjects(serverProjects)
        setActiveProjectId((current) => (
          serverProjects.some((project) => project.id === current)
            ? current
            : serverProjects[0]?.id ?? current
        ))
        setStorage('server')
      })
      .catch(() => {
        setStorage('local')
      })
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, activeProjectId }))
  }, [projects, activeProjectId, hydrated])

  // ?remix=<id> → load a shared app into a fresh local project (viral entry point)
  useEffect(() => {
    if (!hydrated) return
    const remixId = new URLSearchParams(window.location.search).get('remix')
    if (!remixId) return
    let cancelled = false
    void fetch(`/api/playground/share/${encodeURIComponent(remixId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.files) return
        const project: PlaygroundProject = {
          id: createId(),
          name: `${(data.name || data.title || 'remix').toString().replace(/-remix$/, '')}-remix`.slice(0, 64),
          status: 'IDLE',
          template: 'VITE-REACT-TS',
          lastActive: 'now',
          generation: {
            title: data.title || 'Remixed app',
            summary: data.summary || '',
            previewHtml: '',
            files: data.files,
            console: [],
          },
        }
        setProjects((current) => [project, ...current])
        setActiveProjectId(project.id)
        setSelectedFile('src/App.tsx')
        setView('builder')
        // Clean the URL so a refresh doesn't re-remix
        window.history.replaceState({}, '', '/playground')
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [hydrated])

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId],
  )
  const generation = activeProject?.generation ?? null
  const files = useMemo(() => generation?.files ?? [], [generation])
  const activeFile = useMemo(
    () => files.find((file) => file.path === selectedFile) ?? files[0],
    [files, selectedFile],
  )
  const visibleProjects = projects.filter((project) => project.status !== 'ARCHIVED')
  const publishedProjects = projects.filter((project) => project.status === 'PUBLISHED')
  const breadcrumb = view === 'builder'
    ? (activeProject?.name || generation?.title || 'untitled')
    : view

  // Refs so keyboard shortcut handler can access latest values without being
  // listed as useEffect deps (which would re-register the listener on every render).
  const activeProjectRef = useRef(activeProject)
  activeProjectRef.current = activeProject
  const projectsRef = useRef(projects)
  projectsRef.current = projects

  // Power-user shortcuts: ⌘S save · ⌘D duplicate · ⌘⇧S share
  // Must be declared before the early return to obey Rules of Hooks.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const k = e.key.toLowerCase()
      const proj = activeProjectRef.current
      if (k === 's' && e.shiftKey) {
        e.preventDefault()
      } else if (k === 's') {
        e.preventDefault()
        if (proj) {
          void persistServerProject(proj)
            .then((sp) => {
              if (!sp) return
              setStorage('server')
              setProjects((cur) => cur.map((it) => it.id === sp.id ? { ...it, ...sp } : it))
            })
            .catch(() => setStorage('local'))
        }
      } else if (k === 'd') {
        e.preventDefault()
        if (proj?.generation) {
          const source = projectsRef.current.find((item) => item.id === proj.id)
          if (source?.generation) {
            const newProj: PlaygroundProject = {
              id: createId(),
              name: `${source.name.replace(/-remix(-\d+)?$/, '')}-remix`.slice(0, 64),
              status: 'IDLE',
              template: source.template,
              lastActive: 'now',
              generation: { ...source.generation, files: source.generation.files.map((f) => ({ ...f })) },
              messages: source.messages ? [...source.messages] : undefined,
            }
            setProjects((cur) => [newProj, ...cur])
            setActiveProjectId(newProj.id)
            setSelectedFile('src/App.tsx')
            setPane('preview')
            setView('builder')
            setError(null)
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!hydrated) {
    return (
      <main className="min-h-[calc(100vh-6rem)] bg-black text-white font-mono selection:bg-orange-500/30">
        <div className="border-b border-zinc-900 bg-black">
          <div className="h-12 px-4 flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest">Playground</span>
            <span className="text-zinc-700">/</span>
            <span className="text-[11px] uppercase tracking-widest text-zinc-500">Booting</span>
          </div>
        </div>
        <div className="min-h-[calc(100vh-9rem)] bg-black flex items-center justify-center">
          <div className="max-w-md px-6 text-center">
            <div className="mx-auto w-fit"><Spinner size={24} /></div>
            <div className="mt-4 text-[10px] uppercase tracking-widest text-orange-500">Booting sandbox</div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Spinning up a Fly machine for your session - takes a few seconds on first run.
            </p>
          </div>
        </div>
      </main>
    )
  }

  function syncProject(project: PlaygroundProject, extra: { prompt?: string; provider?: string; model?: string } = {}) {
    void persistServerProject(project, extra)
      .then((serverProject) => {
        if (!serverProject) return
        setStorage('server')
        setProjects((current) => current.map((item) => (
          item.id === serverProject.id ? { ...item, ...serverProject } : item
        )))
      })
      .catch(() => {
        setStorage('local')
      })
  }

  function updateActiveProject(
    patch: Partial<PlaygroundProject>,
    extra: { prompt?: string; provider?: string; model?: string } = {},
  ) {
    let nextProject: PlaygroundProject | null = null
    setProjects((current) => current.map((project) => (
      project.id === activeProjectId ? (nextProject = { ...project, ...patch }) : project
    )))
    if (nextProject) syncProject(nextProject, extra)
  }

  function handleWorkbenchEdit(edited: { path: string; content: string }[]) {
    const current = activeProject?.generation
    if (!current) return
    const changed = edited.some(
      (entry) => current.files.find((file) => file.path === entry.path)?.content !== entry.content,
    )
    if (!changed) return
    updateActiveProject({
      generation: {
        ...current,
        files: current.files.map((file) => {
          const entry = edited.find((item) => item.path === file.path)
          return entry ? { ...file, content: entry.content } : file
        }),
      },
      lastActive: 'now',
    })
  }

  function shareProject() {
    if (!activeProject?.generation) return
    const url = `${window.location.origin}/playground/s/${activeProject.id}`
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1800)
    })
  }

  // Bridge: turn the active generated app into an always-on, payable A2A agent
  // listed in the public directory. The server mints an Agent from this project.
  async function makeAgent() {
    if (!activeProject?.generation || makingAgent) return
    setMakingAgent(true)
    setAgentError(null)
    setAgentLink(null)
    try {
      // Ensure the project exists server-side before calling make-agent
      const synced = await persistServerProject(activeProject)
      if (!synced) {
        setAgentError('Sign in and save your project first')
        return
      }

      const res = await fetch(`/api/playground/projects/${activeProject.id}/make-agent`, {
        method: 'POST',
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = body?.error || (res.status === 409 ? 'Generate the app before creating an agent' : res.status === 404 ? 'Project not found on server' : 'Could not create agent')
        setAgentError(msg)
        return
      }

      setAgentMade(true)
      setAgentLink(body?.cardUrl || body?.directoryUrl || '/agents')
      setTimeout(() => { setAgentMade(false); setAgentLink(null) }, 6000)
    } catch {
      setAgentError('Network error — try again')
    } finally {
      setMakingAgent(false)
    }
  }

  function remixProject(projectId: string) {
    const source = projects.find((item) => item.id === projectId)
    if (!source?.generation) return
    const project: PlaygroundProject = {
      id: createId(),
      name: `${source.name.replace(/-remix(-\d+)?$/, '')}-remix`.slice(0, 64),
      status: 'IDLE',
      template: source.template,
      lastActive: 'now',
      generation: { ...source.generation, files: source.generation.files.map((file) => ({ ...file })) },
      messages: source.messages ? [...source.messages] : undefined,
    }
    setProjects((current) => [project, ...current])
    setActiveProjectId(project.id)
    setSelectedFile('src/App.tsx')
    setPane('preview')
    setView('builder')
    setError(null)
    syncProject(project)
  }

  function newProject() {
    const name = window.prompt('Project name', 'untitled')?.trim().slice(0, 64) || 'untitled'
    const project: PlaygroundProject = {
      id: createId(),
      name,
      status: 'IDLE',
      template: 'VITE-REACT-TS',
      lastActive: 'never',
      generation: null,
    }

    setProjects((current) => [project, ...current])
    setActiveProjectId(project.id)
    setSelectedFile('.gitignore')
    setPane('preview')
    setView('builder')
    setError(null)
    syncProject(project, { prompt, provider, model })
  }

  function openProject(projectId: string) {
    const project = projects.find((item) => item.id === projectId)
    setActiveProjectId(projectId)
    setSelectedFile(project?.generation?.files[0]?.path ?? '.gitignore')
    setPane('preview')
    setView('builder')
    if (project?.executionMode) {
      setExecutionMode(project.executionMode)
    }
  }

  function renameProject(projectId: string) {
    let renamedProject: PlaygroundProject | null = null
    setProjects((current) => current.map((project) => {
      if (project.id !== projectId) return project
      const nextName = window.prompt('Project name', project.name)?.trim().slice(0, 64)
      if (!nextName) return project
      renamedProject = { ...project, name: nextName, lastActive: 'now' }
      return renamedProject
    }))
    if (renamedProject) syncProject(renamedProject, { prompt, provider, model })
  }

  function archiveProject(projectId: string) {
    let archivedProject: PlaygroundProject | null = null
    setProjects((current) => current.map((project) => {
      if (project.id !== projectId) return project
      archivedProject = { ...project, status: 'ARCHIVED' as const, lastActive: 'now' }
      return archivedProject
    }))
    if (activeProjectId === projectId) {
      const next = projects.find((project) => project.id !== projectId && project.status !== 'ARCHIVED')
      if (next) setActiveProjectId(next.id)
    }
    if (archivedProject) syncProject(archivedProject, { prompt, provider, model })
  }

  function deleteProject(projectId: string) {
    setProjects((current) => current.filter((project) => project.id !== projectId))
    if (activeProjectId === projectId) {
      const next = projects.find((project) => project.id !== projectId)
      if (next) setActiveProjectId(next.id)
    }
    // Best-effort server delete
    fetch(`/api/playground/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' }).catch(() => {})
  }

  function duplicateProject(projectId: string) {
    const source = projects.find((project) => project.id === projectId)
    if (!source) return

    const project: PlaygroundProject = {
      ...source,
      id: createId('fork'),
      name: `${source.name}-copy`.slice(0, 64),
      status: 'IDLE',
      publishedUrl: undefined,
      deploymentProvider: undefined,
      deploymentId: undefined,
      deploymentState: undefined,
      lastActive: 'now',
    }

    setProjects((current) => [project, ...current])
    setActiveProjectId(project.id)
    setSelectedFile(project.generation?.files[0]?.path ?? '.gitignore')
    setPane('preview')
    setView('builder')
    syncProject(project, { prompt, provider, model })
  }

  function downloadProject(project = activeProject) {
    const projectFiles = project?.generation?.files
    if (!project || !projectFiles?.length) return

    const blob = createZip(projectFiles)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${slugify(project.name)}.zip`
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  async function publishProject() {
    if (!activeProject) return
    if (!activeProject.generation) {
      setPublishError('Generate files before publishing this project.')
      setView('publish')
      return
    }

    setIsPublishing(true)
    setPublishError(null)
    setView('publish')

    try {
      const response = await fetch(`/api/playground/projects/${encodeURIComponent(activeProject.id)}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...activeProject, prompt, provider, model }),
      })

      if (response.status === 401) {
        setPublishError('Sign in to publish this project to Vercel. Your files are still saved locally in this browser.')
        return
      }

      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error || 'Publish failed')
      }

      const published = body?.project as PlaygroundProject | undefined
      if (published) {
        setStorage('server')
        setProjects((current) => current.map((project) => (
          project.id === published.id ? { ...project, ...published } : project
        )))
      }
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setIsPublishing(false)
    }
  }

  async function openInSandbox() {
    if (!activeProject?.generation) return

    setIsSandboxing(true)
    setPublishError(null)
    setSandboxUrl(null)

    try {
      const response = await fetch('/api/playground/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeProject.name,
          files: activeProject.generation.files,
        }),
      })

      if (response.status === 401) {
        setPublishError('Sign in to open a full sandbox.')
        return
      }
      if (response.status === 403) {
        setPublishError('Subscribe to open a full sandbox. Free tier uses the in-browser preview.')
        return
      }

      const body = await response.json()
      if (!response.ok) throw new Error(body?.error || 'Failed to create sandbox')

      setSandboxUrl(body.editorUrl)
      window.open(body.editorUrl, '_blank')
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Sandbox creation failed')
    } finally {
      setIsSandboxing(false)
    }
  }

  function forkToOpenclaw() {
    if (!activeProject?.generation) return
    const gen = activeProject.generation
    const forkedProject: PlaygroundProject = {
      id: createId('fork'),
      name: `${activeProject.name}-deploy`.slice(0, 64),
      status: 'IDLE',
      template: 'VITE-REACT-TS',
      lastActive: 'now',
      generation: gen,
    }
    setProjects((current) => [forkedProject, ...current])
    setActiveProjectId(forkedProject.id)
    setSelectedFile(gen.files[0]?.path ?? '.gitignore')
    setView('publish')
    syncProject(forkedProject, { prompt, provider, model })
  }

  async function refreshPublishedProject() {
    if (!activeProject?.publishedUrl) return

    setIsRefreshingPublish(true)
    setPublishError(null)

    try {
      const response = await fetch(`/api/playground/projects/${encodeURIComponent(activeProject.id)}/publish`, {
        method: 'GET',
      })

      if (response.status === 401) return

      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error || 'Failed to refresh deployment status')
      }

      const refreshed = body?.project as PlaygroundProject | undefined
      if (refreshed) {
        setStorage('server')
        setProjects((current) => current.map((project) => (
          project.id === refreshed.id ? { ...project, ...refreshed } : project
        )))
      }
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Failed to refresh deployment status')
    } finally {
      setIsRefreshingPublish(false)
    }
  }

  async function pushProjectToGitlawb() {
    if (!activeProject) return
    if (!activeProject.generation) {
      setPublishError('Generate files before pushing this project to GitLawb.')
      setView('publish')
      return
    }

    setIsPushingGitlawb(true)
    setPublishError(null)
    setView('publish')

    try {
      const response = await fetch(`/api/playground/projects/${encodeURIComponent(activeProject.id)}/gitlawb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...activeProject, prompt, provider, model }),
      })

      const body = await response.json()
      if (response.status === 401) {
        throw new Error('Sign in to push this project to GitLawb. Your files are still saved locally in this browser.')
      }
      if (!response.ok) {
        throw new Error(body?.error || 'GitLawb push failed')
      }

      const pushed = body?.project as PlaygroundProject | undefined
      if (pushed) {
        setStorage('server')
        setProjects((current) => current.map((project) => (
          project.id === pushed.id ? { ...project, ...pushed } : project
        )))
      }
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'GitLawb push failed')
    } finally {
      setIsPushingGitlawb(false)
    }
  }

  function appendMessage(message: ChatMessage) {
    setProjects((current) => current.map((project) => (
      project.id === activeProjectId
        ? { ...project, messages: [...(project.messages ?? []).slice(-39), message] }
        : project
    )))
  }

  /** Local-only generation patch used while streaming (no server sync per chunk). */
  function patchGenerationLocal(generation: PlaygroundGeneration) {
    setProjects((current) => current.map((project) => (
      project.id === activeProjectId ? { ...project, generation } : project
    )))
  }

  /** Snapshot the current generation into history before it's replaced (undo). */
  function snapshotForHistory(project: PlaygroundProject, label: string): GenerationSnapshot[] | undefined {
    if (!project.generation) return project.history
    const snap: GenerationSnapshot = {
      at: Date.now(),
      label: label.slice(0, 80),
      generation: project.generation,
    }
    return [snap, ...(project.history ?? [])].slice(0, MAX_HISTORY)
  }

  function finishGeneration(data: PlaygroundResponse, cleanPrompt: string) {
    if (!activeProject) return
    const nextName = activeProject.name === 'untitled'
      ? slugify(data.generation.title).replace(/-/g, ' ').slice(0, 42) || activeProject.name
      : activeProject.name

    setProvider(data.provider)
    setModel(data.model)
    updateActiveProject({
      generation: data.generation,
      name: nextName,
      status: activeProject.status === 'PUBLISHED' ? 'PUBLISHED' : 'IDLE',
      lastActive: 'now',
      executionMode,
      // Keep the previous version so users can roll back
      history: snapshotForHistory(activeProject, cleanPrompt || activeProject.generation?.title || 'edit'),
    }, { prompt: cleanPrompt, provider: data.provider, model: data.model })
    setSelectedFile(data.generation.files.find((file) => file.path === 'src/App.tsx')?.path ?? data.generation.files[0]?.path ?? '.gitignore')
    appendMessage({ role: 'assistant', content: `${data.generation.title} — ${data.generation.summary}`, at: Date.now() })
  }

  /** Roll back to a snapshot. The current version is itself snapshotted first,
   *  so restoring is undoable too. */
  function restoreSnapshot(at: number) {
    if (!activeProject) return
    const snap = activeProject.history?.find((s) => s.at === at)
    if (!snap) return
    updateActiveProject({
      generation: snap.generation,
      lastActive: 'now',
      history: snapshotForHistory(activeProject, `before restore · ${new Date(snap.at).toLocaleTimeString()}`),
    })
    setSelectedFile('src/App.tsx')
    setRestoreNonce((v) => v + 1)
    setView('builder')
    setPane('preview')
  }

  /** Follow-up prompts iterate on the current (possibly hand-edited) app files. */
  function collectCurrentFiles() {
    return activeProject?.generation?.files
      .filter((file) => /^src\//.test(file.path) && file.path !== 'src/main.tsx' && file.path !== 'src/vite-env.d.ts')
      .map((file) => ({ path: file.path, content: file.content }))
  }

  async function submitViaJsonRoute(cleanPrompt: string) {
    const currentFiles = collectCurrentFiles()
    const response = await fetch('/api/playground/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanPrompt,
        model,
        ...(currentFiles && currentFiles.length > 0 ? { files: currentFiles } : {}),
      }),
      signal: AbortSignal.timeout(120_000),
    })
    const body = await response.json()
    if (!response.ok) {
      throw new Error(body?.error || 'OpenClaude generation failed')
    }
    finishGeneration(body as PlaygroundResponse, cleanPrompt)
  }

  /**
   * Fast Apply edit path for follow-ups: the model returns lazy edits, the
   * server merges them with the fast model and returns the full app. Cheaper
   * and quicker than a full regen. Returns false if the server fell back to a
   * regeneration or no edit was produced, so the caller can take the stream path.
   */
  async function submitViaEdit(cleanPrompt: string): Promise<boolean> {
    const currentFiles = collectCurrentFiles()
    if (!currentFiles || currentFiles.length === 0) return false

    const response = await fetch('/api/playground/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: cleanPrompt, model, mode: 'edit', files: currentFiles }),
      signal: AbortSignal.timeout(120_000),
    })
    const body = await response.json()
    if (!response.ok) throw new Error(body?.error || 'OpenClaude edit failed')
    // Server only tags mode:'edit' when Fast Apply actually merged; otherwise it
    // regenerated and we still got a valid generation — accept either.
    finishGeneration(body as PlaygroundResponse, cleanPrompt)
    return true
  }

  /** Streaming generation: files land in the live workbench as they arrive. */
  async function submitViaStream(cleanPrompt: string): Promise<boolean> {
    const currentFiles = collectCurrentFiles()
    const baseGeneration: PlaygroundGeneration = activeProject?.generation ?? {
      title: 'Streaming…',
      summary: cleanPrompt.slice(0, 200),
      previewHtml: '',
      files: [],
      console: [],
    }

    const response = await fetch('/api/playground/generate/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanPrompt,
        model,
        ...(currentFiles && currentFiles.length > 0 ? { files: currentFiles } : {}),
      }),
      signal: AbortSignal.timeout(150_000),
    })

    if (!response.ok || !response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
      return false // fall back to the JSON route
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let working = { ...baseGeneration, files: [...baseGeneration.files] }
    let lastApply = 0
    let sawFile = false
    let finished = false

    const upsert = (path: string, content: string) => {
      const index = working.files.findIndex((file) => file.path === path)
      const language = path.endsWith('.tsx') ? 'tsx' : path.endsWith('.ts') ? 'typescript' : path.endsWith('.css') ? 'css' : 'text'
      if (index >= 0) {
        working = { ...working, files: working.files.map((file, i) => (i === index ? { ...file, content } : file)) }
      } else {
        working = { ...working, files: [...working.files, { path, language, content }] }
      }
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const frames = buffer.split('\n\n')
      buffer = frames.pop() ?? ''

      for (const frame of frames) {
        const line = frame.split('\n').find((entry) => entry.startsWith('data:'))
        if (!line) continue
        let event: { type?: string; [key: string]: unknown }
        try {
          event = JSON.parse(line.slice(5).trim())
        } catch {
          continue
        }

        if (event.type === 'meta') {
          working = { ...working, title: String(event.title || working.title), summary: String(event.summary || working.summary) }
        } else if (event.type === 'file_chunk' && typeof event.path === 'string' && typeof event.text === 'string') {
          sawFile = true
          const existing = working.files.find((file) => file.path === event.path)?.content ?? ''
          upsert(event.path, existing + event.text)
          // Throttle live applies so the workbench re-renders smoothly
          if (Date.now() - lastApply > 350) {
            lastApply = Date.now()
            patchGenerationLocal(working)
          }
        } else if (event.type === 'file_close' && typeof event.path === 'string' && typeof event.content === 'string') {
          sawFile = true
          upsert(event.path, event.content)
          lastApply = Date.now()
          patchGenerationLocal(working)
        } else if (event.type === 'done' && event.generation) {
          finished = true
          finishGeneration(
            { provider: String(event.provider || 'vercel-ai-gateway'), model: String(event.model || model), generation: event.generation as PlaygroundGeneration },
            cleanPrompt,
          )
        } else if (event.type === 'error') {
          if (!sawFile) return false // nothing streamed — let the JSON route try
          throw new Error(String(event.error || 'Streaming generation failed'))
        }
      }
    }

    if (!finished && !sawFile) return false
    if (!finished) throw new Error('Stream ended before generation completed. Try again.')
    return true
  }

  async function submit(nextPrompt = prompt) {
    const cleanPrompt = nextPrompt.trim()
    if (!cleanPrompt || isGenerating || !activeProject) return

    // When auto-approve is off, confirm before generating
    if (!autoApprove) {
      const confirmed = window.confirm(`Generate app for: "${cleanPrompt.slice(0, 80)}${cleanPrompt.length > 80 ? '…' : ''}"?`)
      if (!confirmed) return
    }

    setPrompt(cleanPrompt)
    setIsGenerating(true)
    setError(null)
    setPane('preview')
    setView('builder')
    appendMessage({ role: 'user', content: cleanPrompt, at: Date.now() })

    try {
      // Follow-up on an existing app → Fast Apply edit path first (cheap, quick).
      const isFollowUp = (activeProject.generation?.files?.length ?? 0) > 0
      let handled = false
      if (isFollowUp) {
        handled = await submitViaEdit(cleanPrompt).catch(() => false)
      }

      if (!handled) {
        const streamed = await submitViaStream(cleanPrompt).catch((streamError) => {
          if (streamError instanceof Error && streamError.name === 'TimeoutError') {
            throw streamError
          }
          // Stream produced partial output then failed — surface it honestly
          if (streamError instanceof Error && streamError.message !== 'STREAM_UNAVAILABLE') {
            throw streamError
          }
          return false
        })
        if (!streamed) {
          await submitViaJsonRoute(cleanPrompt)
        }
      }
      setPrompt('')
      // Show email capture after first generation (for anonymous/free users)
      if (!emailCaptureSent && files.length > 0) {
        setTimeout(() => setShowEmailCapture(true), 2000)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OpenClaude generation failed'
      // Detect paywall (402) errors
      if (/402|free tier limit|subscribe to generate/i.test(msg)) {
        setShowPaywall(true)
      } else if (err instanceof Error && err.name === 'TimeoutError') {
        setError('Generation timed out. Try a shorter prompt or retry.')
      } else {
        setError(msg)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-6rem)] bg-black text-white font-mono selection:bg-orange-500/30">
      <div className="border-b border-zinc-900 bg-black">
        <div className="min-h-12 px-4 py-2 flex flex-col gap-2 lg:h-12 lg:flex-row lg:items-center lg:justify-between lg:py-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setView('builder')}
              className="text-[11px] font-bold uppercase tracking-widest hover:text-orange-500"
            >
              Playground
            </button>
            <div className="text-zinc-700">/</div>
            <button
              type="button"
              onClick={() => activeProject ? renameProject(activeProject.id) : undefined}
              className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-zinc-400 hover:text-white"
              title="Rename project"
            >
              {breadcrumb}
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto text-[10px] uppercase tracking-widest text-zinc-500 lg:overflow-visible">
            <a
              href="/playground/gallery"
              className="inline-flex items-center gap-1 border border-zinc-800 px-2 py-1 text-zinc-500 hover:text-orange-500 hover:border-orange-500/40 transition-colors shrink-0"
            >
              Gallery
            </a>
            <button
              type="button"
              onClick={() => setAutoApprove((v) => !v)}
              className={`inline-flex items-center gap-1 border px-2 py-1 transition-colors ${
                autoApprove
                  ? 'border-orange-500/40 text-orange-500 hover:bg-orange-500/10'
                  : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {autoApprove ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              Auto-approve {autoApprove ? 'on' : 'off'}
            </button>
            <button type="button" onClick={() => setView('templates')} className="px-2 py-1 hover:text-white">Templates</button>
            <button type="button" onClick={() => setView('apps')} className="px-2 py-1 hover:text-white">Apps</button>
            <button type="button" onClick={() => setView('projects')} className="px-2 py-1 hover:text-white">Projects</button>
            <button
              type="button"
              onClick={() => setView('history')}
              disabled={!activeProject?.history?.length}
              className="px-2 py-1 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title="Roll back to a previous version"
            >
              History{activeProject?.history?.length ? ` · ${activeProject.history.length}` : ''}
            </button>
            <button type="button" onClick={() => setView('publish')} className="px-2 py-1 hover:text-white">Publish</button>
            <button
              type="button"
              onClick={shareProject}
              disabled={!activeProject?.generation}
              className="px-2 py-1 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title="Copy a public share link"
            >
              {shareCopied ? '✓ Link copied' : 'Share'}
            </button>
            <button
              type="button"
              onClick={makeAgent}
              disabled={!activeProject?.generation || makingAgent}
              className="px-2 py-1 text-orange-500 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
              title="Turn this app into an always-on, payable A2A agent in the public directory"
            >
              {agentMade && agentLink ? (
                <a href={agentLink} className="underline">✓ Agent listed</a>
              ) : agentMade ? '✓ Agent listed' : makingAgent ? 'Creating…' : 'Make agent'}
            </button>
            {agentError && (
              <span className="text-[10px] text-red-400 max-w-[180px] truncate" title={agentError}>{agentError}</span>
            )}
            <button type="button" onClick={newProject} className="inline-flex items-center gap-1 border border-zinc-800 px-2 py-1 hover:text-white">
              <Plus className="h-3 w-3" />
              New project
            </button>
            <a href="/coding-agent" className="hidden px-2 py-1 hover:text-white md:inline">Coding Agent</a>
            <a href="/vercel-gateway" className="hidden px-2 py-1 hover:text-white md:inline">Gateway</a>
            <a href="/logout" className="hidden px-2 py-1 hover:text-white sm:inline">Sign out</a>
          </div>
        </div>
      </div>

      {view === 'templates' ? (
        <TemplatesView onSelect={(template) => { setPrompt(template.prompt); setView('builder') }} />
      ) : view === 'projects' ? (
        <ProjectsView
          projects={visibleProjects}
          onNewProject={newProject}
          onOpen={openProject}
          onRename={renameProject}
          onDuplicate={duplicateProject}
          onDownload={downloadProject}
          onArchive={archiveProject}
          onDelete={deleteProject}
        />
      ) : view === 'apps' ? (
        <AppsView projects={publishedProjects} onOpen={openProject} onPublish={() => setView('publish')} onDownload={downloadProject} onRemix={remixProject} />
      ) : view === 'history' ? (
        <HistoryView
          history={activeProject?.history ?? []}
          onRestore={restoreSnapshot}
          onBack={() => setView('builder')}
        />
      ) : view === 'publish' ? (
        <PublishView
          project={activeProject}
          onPublish={publishProject}
          onGitlawbPush={pushProjectToGitlawb}
          onRefresh={refreshPublishedProject}
          onOpen={() => setView('builder')}
          onOpenSandbox={openInSandbox}
          onForkToOpenclaw={forkToOpenclaw}
          isPublishing={isPublishing}
          isPushingGitlawb={isPushingGitlawb}
          isRefreshing={isRefreshingPublish}
          isSandboxing={isSandboxing}
          publishError={publishError}
          sandboxUrl={sandboxUrl}
        />
      ) : (
        <BuilderView
          prompt={prompt}
          setPrompt={setPrompt}
          files={files}
          generation={generation}
          activeFile={activeFile}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          pane={pane}
          setPane={setPane}
          viewport={viewport}
          setViewport={setViewport}
          isGenerating={isGenerating}
          error={error}
          sessionId={sessionId}
          provider={provider}
          model={model}
          storage={storage}
          submit={submit}
          onDownload={() => downloadProject()}
          workbenchKey={`${activeProjectId}:${restoreNonce}`}
          onWorkbenchEdit={handleWorkbenchEdit}
          messages={activeProject?.messages ?? []}
          setModel={setModel}
          autoApprove={autoApprove}
          executionMode={executionMode}
          setExecutionMode={setExecutionMode}
          sandboxName={sandboxName}
        />
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md border border-zinc-800 bg-black p-8">
            <button type="button" onClick={() => setShowPaywall(false)} className="absolute right-4 top-4 text-zinc-600 hover:text-white">
              <X className="h-4 w-4" />
            </button>
            <div className="text-[10px] uppercase tracking-widest text-orange-500">Free tier limit reached</div>
            <h2 className="mt-3 text-2xl font-bold uppercase tracking-tighter">Upgrade to Pro</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              You&apos;ve used all 3 free generations today. Subscribe to generate unlimited apps, open full sandboxes, and deploy to production.
            </p>
            <div className="mt-6 space-y-3">
              <a
                href="/pricing"
                className="block w-full bg-white py-3 text-center text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200"
              >
                View plans — from £29/mo
              </a>
              <button
                type="button"
                onClick={() => setShowPaywall(false)}
                className="w-full border border-zinc-800 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white"
              >
                Maybe later
              </button>
            </div>
            <div className="mt-6 border-t border-zinc-900 pt-4 text-xs text-zinc-600">
              <div className="font-bold text-zinc-400">Every plan includes:</div>
              <ul className="mt-2 space-y-1">
                <li>→ Unlimited generations</li>
                <li>→ Full CodeSandbox environments</li>
                <li>→ Deploy to Vercel / GitLawb</li>
                <li>→ Fork to OpenClaw agents</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Email Capture Modal */}
      {showEmailCapture && !emailCaptureSent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md border border-zinc-800 bg-black p-8">
            <button type="button" onClick={() => setShowEmailCapture(false)} className="absolute right-4 top-4 text-zinc-600 hover:text-white">
              <X className="h-4 w-4" />
            </button>
            <div className="text-[10px] uppercase tracking-widest text-orange-500">Save your work</div>
            <h2 className="mt-3 text-2xl font-bold uppercase tracking-tighter">Don&apos;t lose your app</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Enter your email to save this project. We&apos;ll also send you tips on how to deploy it.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const form = new FormData(e.currentTarget)
                const email = String(form.get('email') || '')
                if (!email) return
                try {
                  await fetch('/api/playground/capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, projectId: activeProject?.id }),
                  })
                } catch { /* best effort */ }
                setEmailCaptureSent(true)
                setShowEmailCapture(false)
              }}
              className="mt-6 space-y-3"
            >
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full bg-white py-3 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200"
              >
                Save project
              </button>
              <button
                type="button"
                onClick={() => setShowEmailCapture(false)}
                className="w-full border border-zinc-800 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white"
              >
                Skip
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

function BuilderView({
  prompt,
  setPrompt,
  files,
  generation,
  activeFile,
  selectedFile,
  setSelectedFile,
  pane,
  setPane,
  viewport,
  setViewport,
  isGenerating,
  error,
  sessionId,
  provider,
  model,
  storage,
  submit,
  onDownload,
  workbenchKey,
  onWorkbenchEdit,
  messages,
  setModel,
  autoApprove,
  executionMode,
  setExecutionMode,
  sandboxName,
}: {
  prompt: string
  setPrompt: (value: string) => void
  files: PlaygroundFile[]
  generation: PlaygroundGeneration | null
  activeFile: PlaygroundFile | undefined
  selectedFile: string
  setSelectedFile: (path: string) => void
  pane: Pane
  setPane: (pane: Pane) => void
  viewport: Viewport
  setViewport: (viewport: Viewport) => void
  isGenerating: boolean
  error: string | null
  sessionId: string
  provider: string
  model: string
  storage: 'local' | 'server'
  submit: (prompt?: string) => Promise<void>
  onDownload: () => void
  workbenchKey: string
  onWorkbenchEdit: (files: { path: string; content: string }[]) => void
  messages: ChatMessage[]
  setModel: (model: string) => void
  autoApprove: boolean
  executionMode: ExecutionMode
  setExecutionMode: (mode: ExecutionMode) => void
  sandboxName: string | null
}) {
  const [consoleFilter, setConsoleFilter] = useState<ConsoleLevel>('all')
  const [runtimeError, setRuntimeError] = useState<{ message: string; filePath?: string; line?: number } | null>(null)
  const [fixCount, setFixCount] = useState(0)
  const [showSandboxConsole, setShowSandboxConsole] = useState(false)
  const [consoleCleared, setConsoleCleared] = useState(false)
  const [consoleCollapsed, setConsoleCollapsed] = useState(false)

  // Reset fix count when generation changes (new build)
  useEffect(() => {
    setFixCount(0)
    setRuntimeError(null)
  }, [generation])

  const consoleEntries = useMemo(
    () => buildConsoleEntries(generation, error, isGenerating),
    [generation, error, isGenerating],
  )
  const visibleConsoleEntries = useMemo(() => {
    if (consoleCleared) return []
    if (consoleFilter === 'all') return consoleEntries
    return consoleEntries.filter((entry) => entry.level === consoleFilter)
  }, [consoleCleared, consoleEntries, consoleFilter])

  useEffect(() => {
    setConsoleCleared(false)
  }, [generation, error, isGenerating])

  // Rotate a build verb every 1.3s while generating (Claude-style thinking words)
  const [verbIndex, setVerbIndex] = useState(0)
  useEffect(() => {
    if (!isGenerating) {
      setVerbIndex(0)
      return
    }
    const id = setInterval(() => setVerbIndex((i) => i + 1), 1300)
    return () => clearInterval(id)
  }, [isGenerating])
  const spinnerVerb = SPINNER_VERBS[verbIndex % SPINNER_VERBS.length]

  const heroMode = !generation && messages.length === 0 && !isGenerating

  if (heroMode) {
    return (
      <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-5 py-16">
        <div className="w-full max-w-2xl text-center">
          <div className="text-[10px] uppercase tracking-widest text-orange-500">Agentbot Playground</div>
          <h1 className="mt-4 text-4xl font-bold uppercase leading-[0.9] tracking-tighter sm:text-5xl">
            What do you want<br />to <span className="text-orange-500">create?</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-500">
            Prompt. Build. Publish. Describe an app and watch it stream into a live preview.
          </p>

          <div className="mt-8 border border-zinc-800 bg-zinc-950 text-left">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (!event.shiftKey || event.metaKey || event.ctrlKey)) {
                  event.preventDefault()
                  void submit()
                }
              }}
              autoFocus
              className="min-h-32 w-full resize-none bg-transparent p-4 text-sm leading-relaxed text-white placeholder:text-zinc-600 focus:outline-none"
              placeholder="Describe the app you want to build…"
            />
            <div className="flex items-center justify-between gap-2 border-t border-zinc-900 px-3 py-2">
              <div className="flex items-center gap-2">
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  aria-label="Model"
                  className="border border-zinc-800 bg-black px-1.5 py-1 text-[10px] uppercase tracking-widest text-zinc-400 focus:border-zinc-600 focus:outline-none"
                >
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <div className="flex items-center border border-zinc-800 bg-black">
                  <button
                    type="button"
                    onClick={() => setExecutionMode('sandpack')}
                    className={`px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
                      executionMode === 'sandpack'
                        ? 'bg-white text-black'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                    title="In-browser React preview (client-side only)"
                  >
                    Browser
                  </button>
                  <button
                    type="button"
                    onClick={() => setExecutionMode('sandbox')}
                    className={`px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
                      executionMode === 'sandbox'
                        ? 'bg-white text-black'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                    title="Full-stack Linux VM (Next.js, API routes, database)"
                  >
                    Full-Stack
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={prompt.trim().length < 12}
                className="inline-flex h-8 items-center gap-2 bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                Build
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {TEMPLATES.slice(0, 6).map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setPrompt(template.prompt)}
                className="border border-zinc-900 px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:border-zinc-700 hover:text-white"
              >
                {template.title}
              </button>
            ))}
          </div>

          {error && (
            <div className="mx-auto mt-5 max-w-md border border-red-900/70 bg-red-950/20 p-3 text-left text-xs leading-relaxed text-red-400">
              {error}
            </div>
          )}

          <div className="mt-10 text-[10px] uppercase tracking-widest text-zinc-700">
            Powered by{' '}
            <a href="https://x.com/XiaomiMiMo" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-orange-500">
              Xiaomi MiMo
            </a>
            {' '}· MiMo-V2.5-Pro · Free
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-[calc(100vh-9rem)] lg:grid-cols-[440px_1fr]">
      <aside className="border-b border-zinc-900 lg:border-b-0 lg:border-r h-[calc(100vh-9rem)] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <div className="border-b border-zinc-900 px-4 py-3 flex items-center justify-end h-12">
            <div className="flex items-center gap-2">
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                disabled={isGenerating}
                aria-label="Model"
                className="border border-zinc-800 bg-black px-2 py-1.5 text-[10px] uppercase tracking-widest text-zinc-400 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
                {!MODEL_OPTIONS.some((option) => option.value === model) && (
                  <option value={model}>{model}</option>
                )}
              </select>
              <div className="flex items-center border border-zinc-800 bg-black">
                <button
                  type="button"
                  onClick={() => setExecutionMode('sandpack')}
                  disabled={isGenerating}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
                    executionMode === 'sandpack'
                      ? 'bg-white text-black'
                      : 'text-zinc-500 hover:text-white'
                  } disabled:opacity-50`}
                  title="In-browser React preview (client-side only)"
                >
                  Browser
                </button>
                <button
                  type="button"
                  onClick={() => setExecutionMode('sandbox')}
                  disabled={isGenerating}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
                    executionMode === 'sandbox'
                      ? 'bg-white text-black'
                      : 'text-zinc-500 hover:text-white'
                  } disabled:opacity-50`}
                  title="Full-stack Linux VM (Next.js, API routes, database)"
                >
                  Full-Stack
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5 flex-1">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tighter">What should we build?</h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{PLAYGROUND_PROMISE}</p>
            </div>

            {messages.length > 0 && (
              <div className="max-h-72 space-y-2 overflow-y-auto border border-zinc-900 bg-zinc-950/50 p-3">
                {messages.map((message, index) => (
                  <div key={`${message.at}-${index}`} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                    <div className={`inline-block max-w-[90%] border px-3 py-2 text-left text-xs leading-relaxed ${
                      message.role === 'user'
                        ? 'border-zinc-700 bg-zinc-900 text-zinc-200'
                        : 'border-orange-500/30 bg-orange-500/5 text-zinc-300'
                    }`}>
                      <div className={`mb-1 text-[9px] uppercase tracking-widest ${message.role === 'user' ? 'text-zinc-500' : 'text-orange-500'}`}>
                        {message.role === 'user' ? 'You' : 'OpenClaude'}
                      </div>
                      {message.content}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="text-left">
                    <div className="inline-flex items-center gap-2 border border-orange-500/30 bg-orange-500/5 px-3 py-2 text-xs text-orange-500">
                      <Spinner size={12} /> {spinnerVerb}…
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={messages.length > 0 ? 'hidden' : 'space-y-2'}>
              {TEMPLATES.slice(0, 6).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setPrompt(template.prompt)}
                  className="w-full border border-zinc-900 bg-black p-3 text-left hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <template.icon className="h-3 w-3 text-zinc-500" />
                    <div className="text-[10px] uppercase tracking-widest text-white">{template.title}</div>
                  </div>
                  <div className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-500">{template.description}</div>
                </button>
              ))}
            </div>

            <div className="border border-zinc-800 bg-zinc-950">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (!event.shiftKey || event.metaKey || event.ctrlKey)) {
                    event.preventDefault()
                    void submit()
                  }
                }}
                className="min-h-40 w-full resize-none bg-transparent p-4 text-sm leading-relaxed text-white placeholder:text-zinc-600 focus:outline-none"
                placeholder="Describe the app you want OpenClaude to build..."
              />
              <div className="border-t border-zinc-900 px-3 py-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-zinc-600">
                  <Kbd small meta>↵</Kbd> send · <Kbd small shift>↵</Kbd> newline
                </span>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={isGenerating || prompt.trim().length < 12}
                  className="inline-flex h-8 items-center gap-2 bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isGenerating ? <Spinner size={14} /> : <Send className="h-3.5 w-3.5" />}
                  Send
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start justify-between gap-3 border border-red-900/70 bg-red-950/20 p-3 text-xs leading-relaxed text-red-400">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={isGenerating || prompt.trim().length < 12}
                  className="shrink-0 border border-red-900/70 px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-red-950/40 disabled:opacity-40"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-900 px-4 py-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-600">
            <span>Files {files.length}</span>
            <a href="https://x.com/XiaomiMiMo" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500">
              MiMo · Free
            </a>
            <span>Session {sessionId}</span>
          </div>
        </div>
      </aside>

      <section className="min-w-0 flex flex-col">
        <div className="border-b border-zinc-900 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPane('preview')}
              className={`inline-flex h-8 items-center gap-2 border px-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${pane === 'preview' ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              <Monitor className="h-3.5 w-3.5" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => setPane('code')}
              className={`inline-flex h-8 items-center gap-2 border px-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${pane === 'code' ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              <Code2 className="h-3.5 w-3.5" />
              Code
            </button>
          </div>

          <div className="flex items-center gap-1">
            {([
              ['mobile', Smartphone],
              ['tablet', Tablet],
              ['desktop', Monitor],
              ['fill', Maximize2],
            ] as const).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setViewport(key)}
                title={key}
                className={`inline-flex h-8 w-8 items-center justify-center border transition-colors ${viewport === key ? 'border-orange-500 text-orange-500' : 'border-zinc-800 text-zinc-500 hover:text-white'}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowSandboxConsole((value) => !value)}
              title="Toggle runtime console"
              className={`ml-2 inline-flex h-8 items-center gap-2 border px-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${showSandboxConsole ? 'border-orange-500 text-orange-500' : 'border-zinc-800 text-zinc-500 hover:text-white'}`}
            >
              <Terminal className="h-3.5 w-3.5" />
              Console
            </button>
          </div>
        </div>

        {runtimeError && !isGenerating && (
          <div className="flex items-center justify-between gap-3 border-b border-red-900/70 bg-red-950/20 px-4 py-2 text-xs text-red-400">
            <span className="min-w-0 truncate" title={runtimeError.message}>
              Runtime error: {runtimeError.filePath ? `${runtimeError.filePath}${runtimeError.line ? `:${runtimeError.line}` : ''} — ` : ''}{runtimeError.message}
            </span>
            {fixCount < 3 ? (
              <button
                type="button"
                onClick={() => {
                  setFixCount((c) => c + 1)
                  const loc = runtimeError.filePath ? ` in ${runtimeError.filePath}${runtimeError.line ? ` line ${runtimeError.line}` : ''}` : ''
                  void submit(`Fix this error${loc} without changing anything else: ${runtimeError.message}`)
                }}
                className="shrink-0 border border-red-900/70 px-2 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-red-950/40"
              >
                Fix with AI{fixCount > 0 ? ` (${fixCount + 1}/3)` : ''}
              </button>
            ) : (
              <span className="shrink-0 text-[10px] uppercase tracking-widest text-red-500">
                Manual fix needed
              </span>
            )}
          </div>
        )}

        <div className="grid flex-1 min-h-[560px] xl:grid-cols-[1fr_280px]">
          <div className="min-w-0 bg-zinc-950/50 p-4">
            {isGenerating && (!generation || generation.files.length === 0) ? (
              <div className="h-full min-h-[520px] border border-zinc-900 bg-black flex items-center justify-center">
                <div className="max-w-md px-6 text-center">
                  <div className="mx-auto w-fit"><Spinner size={24} /></div>
                  <div className="mt-4 text-[10px] uppercase tracking-widest text-orange-500" aria-live="polite">{spinnerVerb}…</div>
                  <h2 className="mt-3 text-2xl font-bold uppercase tracking-tighter">Building app</h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                    OpenClaude is editing files; the preview updates as changes land.
                  </p>
                  <div className="mt-6 grid gap-2 border border-zinc-900 bg-zinc-950/70 p-4 text-left text-[10px] uppercase tracking-widest text-zinc-600">
                    <div className="flex items-center justify-between gap-4">
                      <span>Sandbox</span>
                      <span className="text-orange-500">Booting</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Files</span>
                      <span className="text-zinc-400">Writing</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Preview</span>
                      <span className="text-zinc-400">Refreshing</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : pane === 'preview' ? (
              <div className="h-full min-h-[520px] overflow-auto border border-zinc-900 bg-zinc-950 p-4">
                {isGenerating && (
                  <div className="mb-3 flex items-center gap-2 border border-orange-500/30 bg-orange-500/5 px-3 py-2 text-[10px] uppercase tracking-widest text-orange-500">
                    <Spinner size={12} />
                    {spinnerVerb}… {executionMode === 'sandbox' ? 'deploying to VM' : 'streaming to preview'}
                  </div>
                )}
                <div className={`mx-auto h-full min-h-[488px] transition-all ${VIEWPORTS[viewport]}`}>
                  {generation ? (
                    executionMode === 'sandbox' ? (
                      <SandboxWorkbench
                        generationKey={workbenchKey}
                        files={files}
                        mode="preview"
                        isStreaming={isGenerating}
                        onError={(error) => setRuntimeError({ message: error })}
                      />
                    ) : (
                      <SandpackWorkbench
                        generationKey={workbenchKey}
                        files={files}
                        mode="preview"
                        showConsole={showSandboxConsole}
                        isStreaming={isGenerating}
                        onFilesChange={onWorkbenchEdit}
                        onError={setRuntimeError}
                      />
                    )
                  ) : (
                    <div className="h-full min-h-[488px] bg-black text-white flex items-center justify-center p-8">
                      <div className="max-w-md text-center">
                        <div className="text-[10px] uppercase tracking-widest text-orange-500">Playground</div>
                        <h2 className="mt-3 text-3xl font-bold uppercase tracking-tighter">Your app starts here.</h2>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                          Tell the assistant what you want to build. It will edit the files in this project and the
                          preview will update automatically.
                        </p>
                        <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
                          {executionMode === 'sandbox' ? (
                            <>
                              <span className="border border-zinc-900 px-2 py-1">Next.js App Router</span>
                              <span className="border border-zinc-900 px-2 py-1">API Routes</span>
                              <span className="border border-zinc-900 px-2 py-1">Database</span>
                              <span className="border border-zinc-900 px-2 py-1">Terminal</span>
                            </>
                          ) : (
                            <>
                              <span className="border border-zinc-900 px-2 py-1">Vite + React</span>
                              <span className="border border-zinc-900 px-2 py-1">Instant Preview</span>
                              <span className="border border-zinc-900 px-2 py-1">Client-Side</span>
                            </>
                          )}
                        </div>
                        <div className="mt-6 border border-zinc-900 bg-zinc-950/80 p-4 text-left">
                          <div className="text-[10px] uppercase tracking-widest text-zinc-300">
                            {executionMode === 'sandbox' ? 'Booting Full-Stack VM' : 'Booting Preview'}
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                            {executionMode === 'sandbox'
                              ? 'Spinning up a Linux VM with Next.js support — takes a few seconds on first run.'
                              : 'In-browser preview starts instantly — no server required.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[520px] overflow-hidden border border-zinc-900 bg-black">
                <div className="border-b border-zinc-900 px-3 py-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
                  <FileText className="h-3.5 w-3.5" />
                  {activeFile?.path ?? 'No file selected'}
                  {generation && activeFile && /^src\/(?:App\.tsx|index\.css|(?:components|hooks|lib)\/[A-Za-z0-9_-]+\.(?:tsx|ts)|[A-Za-z0-9_-]+\.css)$/.test(activeFile.path) && (
                    <span className="ml-auto text-orange-500">Editable · live reload</span>
                  )}
                </div>
                {executionMode === 'sandbox' ? (
                  generation ? (
                    <SandboxWorkbench
                      generationKey={workbenchKey}
                      files={files}
                      mode="terminal"
                      isStreaming={isGenerating}
                      onError={(error) => setRuntimeError({ message: error })}
                    />
                  ) : (
                    <pre className="h-[488px] overflow-auto p-4 text-xs leading-relaxed text-zinc-300">
                      <code>Terminal will appear when sandbox is running.</code>
                    </pre>
                  )
                ) : generation && activeFile && /^src\/(?:App\.tsx|index\.css|(?:components|hooks|lib)\/[A-Za-z0-9_-]+\.(?:tsx|ts)|[A-Za-z0-9_-]+\.css)$/.test(activeFile.path) ? (
                  <SandpackWorkbench
                    generationKey={workbenchKey}
                    files={files}
                    mode="code"
                    activeFile={activeFile?.path}
                    isStreaming={isGenerating}
                    onFilesChange={onWorkbenchEdit}
                    onError={setRuntimeError}
                  />
                ) : (
                  <pre className="h-[488px] overflow-auto p-4 text-xs leading-relaxed text-zinc-300">
                    <code>{activeFile?.content ?? 'Generate a project to inspect code.'}</code>
                  </pre>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-900 xl:border-l xl:border-t-0">
            <div className="border-b border-zinc-900 px-4 py-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500">
              <span>Files {files.length}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="download zip"
                  onClick={onDownload}
                  disabled={files.length === 0}
                  className="text-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="refresh files"
                  onClick={() => setSelectedFile(files[0]?.path ?? '.gitignore')}
                  disabled={files.length === 0}
                  className="text-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="p-3 space-y-1">
              {files.length === 0 ? (
                <div className="px-2 py-8 text-center text-xs leading-relaxed text-zinc-600">
                  Files appear after OpenClaude writes the project.
                </div>
              ) : files.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => {
                    setSelectedFile(file.path)
                    setPane('code')
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-2 text-left text-xs transition-colors ${selectedFile === file.path ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-950 hover:text-white'}`}
                >
                  <span className="min-w-0 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{file.path}</span>
                  </span>
                  <span className="text-[10px] text-zinc-600">{formatBytes(file.content.length)}</span>
                </button>
              ))}
            </div>

            {activeFile && (
              <>
                <div className="border-y border-zinc-900 px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500">
                  {fileLabel(activeFile.path)} · {activeFile.language}
                </div>
                <pre className="max-h-56 overflow-auto p-4 text-xs leading-relaxed text-zinc-400">
                  <code>{activeFile.content}</code>
                </pre>
              </>
            )}

            <div className="border-y border-zinc-900 px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-500">
              Runtime
            </div>
            <div className="p-4 space-y-3 text-xs text-zinc-500">
              <div className="flex items-center justify-between gap-4">
                <span>Provider</span>
                <span className="text-zinc-300">{provider}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Model</span>
                <span className="text-zinc-300">{model}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Mode</span>
                <span className={autoApprove ? 'text-orange-500' : 'text-zinc-300'}>{autoApprove ? 'auto-approve' : 'manual'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Gateway</span>
                <span className="text-zinc-300">agentbot</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Storage</span>
                <span className="text-zinc-300">{storage}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-900 flex-shrink-0">
          <div className="px-4 py-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
            <button
              type="button"
              title={consoleCollapsed ? 'expand console' : 'collapse console'}
              onClick={() => setConsoleCollapsed((value) => !value)}
              className="inline-flex h-5 w-5 items-center justify-center border border-zinc-900 text-zinc-600 hover:text-white"
            >
              {consoleCollapsed ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            </button>
            <Terminal className="h-3.5 w-3.5" />
            <span>Console</span>
            <div className="ml-auto flex items-center gap-1">
              {(['all', 'error', 'warn', 'log'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConsoleFilter(level)}
                  disabled={consoleCollapsed}
                  className={`px-2 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${consoleFilter === level ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                >
                  {level}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setConsoleCleared(true)}
                disabled={consoleCollapsed}
                className="px-2 py-1 text-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Clear
              </button>
              <Columns3 className="h-3.5 w-3.5 text-zinc-700" />
            </div>
          </div>
          {!consoleCollapsed ? (
            <div className="min-h-[120px] max-h-[200px] overflow-y-auto border-t border-zinc-900 bg-black px-4 py-3 font-mono text-xs text-zinc-500">
              {visibleConsoleEntries.length === 0 ? (
                <div className="leading-relaxed text-zinc-700">
                  no console output yet — the preview&apos;s logs and errors will show up here.
                </div>
              ) : visibleConsoleEntries.map((entry, index) => (
                <div key={`${entry.level}-${entry.message}-${index}`} className="leading-relaxed">
                  <span className={entry.level === 'error' ? 'text-red-500' : entry.level === 'warn' ? 'text-yellow-500' : 'text-zinc-700'}>
                    {entry.level === 'error' ? 'x' : entry.level === 'warn' ? '!' : '+'}
                  </span>{' '}
                  <span className={entry.level === 'error' ? 'text-red-400' : entry.level === 'warn' ? 'text-yellow-500' : 'text-zinc-500'}>
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function ProjectsView({
  projects,
  onNewProject,
  onOpen,
  onRename,
  onDuplicate,
  onDownload,
  onArchive,
  onDelete,
}: {
  projects: PlaygroundProject[]
  onNewProject: () => void
  onOpen: (id: string) => void
  onRename: (id: string) => void
  onDuplicate: (id: string) => void
  onDownload: (project: PlaygroundProject) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <section className="max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600">Playground / Projects</div>
          <h1 className="mt-3 text-3xl font-bold uppercase tracking-tighter">Your projects</h1>
          <p className="mt-2 text-sm text-zinc-500">{projects.length} projects</p>
        </div>
        <button
          type="button"
          onClick={onNewProject}
          className="inline-flex items-center gap-2 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200"
        >
          <Plus className="h-3.5 w-3.5" />
          New project
        </button>
      </div>

      <div className="divide-y divide-zinc-900 border-y border-zinc-900">
        {projects.map((project) => (
          <div key={project.id} className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold tracking-tighter">{project.name}</h2>
                <span className={project.status === 'PUBLISHED' ? 'text-[10px] uppercase tracking-widest text-green-500' : 'text-[10px] uppercase tracking-widest text-zinc-600'}>
                  {project.status}
                </span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-widest text-zinc-600">
                Template {project.template} · Last active {project.lastActive}
                {project.publishedUrl ? ` · ${project.publishedUrl}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest">
              <button type="button" onClick={() => onOpen(project.id)} className="border border-zinc-800 px-3 py-2 text-zinc-300 hover:border-zinc-600 hover:text-white">
                Open
              </button>
              <button type="button" onClick={() => onRename(project.id)} className="border border-zinc-800 px-3 py-2 text-zinc-500 hover:border-zinc-600 hover:text-white">
                Rename
              </button>
              <button type="button" onClick={() => onDuplicate(project.id)} className="inline-flex items-center gap-2 border border-zinc-800 px-3 py-2 text-zinc-500 hover:border-zinc-600 hover:text-white">
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => onDownload(project)}
                disabled={!project.generation}
                className="inline-flex items-center gap-2 border border-zinc-800 px-3 py-2 text-zinc-500 hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Download className="h-3.5 w-3.5" />
                Zip
              </button>
              <button type="button" onClick={() => onArchive(project.id)} className="inline-flex items-center gap-2 border border-zinc-800 px-3 py-2 text-zinc-500 hover:border-zinc-600 hover:text-white">
                <Archive className="h-3.5 w-3.5" />
                Archive
              </button>
              <button
                type="button"
                onClick={() => { if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) onDelete(project.id) }}
                className="inline-flex items-center gap-2 border border-zinc-800 px-3 py-2 text-zinc-600 hover:border-red-900 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function HistoryView({
  history,
  onRestore,
  onBack,
}: {
  history: GenerationSnapshot[]
  onRestore: (at: number) => void
  onBack: () => void
}) {
  return (
    <section className="max-w-3xl px-6 py-10">
      <button onClick={onBack} className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400">← Builder</button>
      <h1 className="mt-3 text-3xl font-bold uppercase tracking-tighter">Version history</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
        Every generation and AI edit is snapshotted automatically. Roll back to any previous version
        — restoring is itself undoable, so you never lose work. Keeps the last {MAX_HISTORY} versions
        on this device.
      </p>

      {history.length === 0 ? (
        <div className="mt-8 border border-zinc-900 p-8 text-center text-sm text-zinc-600">
          No history yet. Build or edit an app and previous versions will appear here.
        </div>
      ) : (
        <div className="mt-8 space-y-px bg-zinc-900">
          {history.map((snap, i) => (
            <div key={snap.at} className="flex items-center justify-between gap-4 bg-black p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-orange-500">
                    {i === 0 ? 'Most recent' : `#${history.length - i}`}
                  </span>
                  <span className="text-[10px] text-zinc-600">{new Date(snap.at).toLocaleString()}</span>
                </div>
                <div className="mt-1 truncate text-sm text-zinc-300">{snap.generation.title}</div>
                <div className="truncate text-xs text-zinc-600">{snap.label}</div>
              </div>
              <button
                onClick={() => onRestore(snap.at)}
                className="shrink-0 border border-zinc-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:border-orange-500 hover:text-orange-500"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function AppsView({
  projects,
  onOpen,
  onPublish,
  onDownload,
  onRemix,
}: {
  projects: PlaygroundProject[]
  onOpen: (id: string) => void
  onPublish: () => void
  onDownload: (project: PlaygroundProject) => void
  onRemix: (id: string) => void
}) {
  return (
    <section className="max-w-5xl px-6 py-10">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600">Playground / Apps</div>
        <h1 className="mt-3 text-3xl font-bold uppercase tracking-tighter">Apps</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Published playground apps show here. Open a project to inspect files, open the live app, or download the generated source.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="border border-zinc-900 p-8">
          <Globe2 className="h-5 w-5 text-orange-500" />
          <h2 className="mt-5 text-xl font-bold uppercase tracking-tighter">No published apps yet</h2>
          <p className="mt-2 text-sm text-zinc-500">Publish the current project to create the first app entry.</p>
          <button
            type="button"
            onClick={onPublish}
            className="mt-6 border border-zinc-800 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:border-zinc-600 hover:text-white"
          >
            Go to publish
          </button>
        </div>
      ) : (
        <div className="grid gap-px bg-zinc-900 md:grid-cols-2">
          {projects.map((project) => (
            <div key={project.id} className="bg-black p-6">
              {(() => {
                const liveUrl = externalUrl(project.publishedUrl)
                return (
                  <>
              <div className="text-[10px] uppercase tracking-widest text-green-500">Published</div>
              <h2 className="mt-4 text-xl font-bold tracking-tighter">{project.name}</h2>
              <p className="mt-2 text-xs uppercase tracking-widest text-zinc-600">{project.publishedUrl}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-500">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-700">Provider</div>
                  <div className="mt-1 text-zinc-300">{project.deploymentProvider ?? 'preview'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-700">State</div>
                  <div className="mt-1 text-zinc-300">{project.deploymentState ?? 'published'}</div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpen(project.id)}
                  className="inline-flex items-center gap-2 border border-zinc-800 px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-300 hover:text-white"
                >
                  Inspect
                  <Code2 className="h-3.5 w-3.5" />
                </button>
                {liveUrl ? (
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-zinc-800 px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-300 hover:text-white"
                  >
                    Open app
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => onDownload(project)}
                  disabled={!project.generation}
                  className="inline-flex items-center gap-2 border border-zinc-800 px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Zip
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemix(project.id)}
                  disabled={!project.generation}
                  title="Duplicate into a new project and keep building"
                  className="inline-flex items-center gap-2 border border-orange-500/40 px-3 py-2 text-[10px] uppercase tracking-widest text-orange-500 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Remix
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
                  </>
                )
              })()}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function PublishView({
  project,
  onPublish,
  onGitlawbPush,
  onRefresh,
  onOpen,
  onOpenSandbox,
  onForkToOpenclaw,
  isPublishing,
  isPushingGitlawb,
  isRefreshing,
  isSandboxing,
  publishError,
  sandboxUrl,
}: {
  project: PlaygroundProject | undefined
  onPublish: () => Promise<void>
  onGitlawbPush: () => Promise<void>
  onRefresh: () => Promise<void>
  onOpen: () => void
  onOpenSandbox: () => Promise<void>
  onForkToOpenclaw: () => void
  isPublishing: boolean
  isPushingGitlawb: boolean
  isRefreshing: boolean
  isSandboxing: boolean
  publishError: string | null
  sandboxUrl: string | null
}) {
  const canPublish = Boolean(project?.generation)

  return (
    <section className="max-w-5xl px-6 py-10">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600">Playground / Publish</div>
        <h1 className="mt-3 text-3xl font-bold uppercase tracking-tighter">Publish project</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Publish the generated Vite app as an Agentbot preview, then push the same source to a GitLawb node as a real git repo.
        </p>
      </div>

      <div className="grid gap-px bg-zinc-900 md:grid-cols-[1fr_320px]">
        <div className="bg-black p-6">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600">Current project</div>
          <h2 className="mt-4 text-2xl font-bold tracking-tighter">{project?.name ?? 'untitled'}</h2>
          <p className="mt-3 text-sm text-zinc-500">
            {project?.generation?.summary ?? 'Generate files before publishing this project.'}
          </p>
          {project?.publishedUrl && (
            <a
              href={externalUrl(project.publishedUrl) ?? project.publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-green-500 hover:text-green-400"
            >
              {project.publishedUrl}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {publishError && (
            <p className="mt-4 text-xs leading-relaxed text-yellow-500">{publishError}</p>
          )}
        </div>
        <div className="bg-black p-6">
          <div className="space-y-3 text-xs text-zinc-500">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="text-zinc-300">{project?.status ?? 'IDLE'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Template</span>
              <span className="text-zinc-300">{project?.template ?? 'VITE-REACT-TS'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Files</span>
              <span className="text-zinc-300">{project?.generation?.files.length ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Target</span>
              <span className="text-zinc-300">{project?.deploymentProvider ?? 'vercel-ready'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>State</span>
              <span className="text-zinc-300">{project?.deploymentState ?? 'preview'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onPublish()}
            disabled={!canPublish || isPublishing}
            className="mt-6 w-full bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPublishing ? 'Publishing' : 'Publish'}
          </button>
          <button
            type="button"
            onClick={() => void onGitlawbPush()}
            disabled={!canPublish || isPushingGitlawb}
            className="mt-2 w-full border border-orange-500/50 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-orange-400 hover:border-orange-400 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPushingGitlawb ? 'Pushing to GitLawb' : 'Push to GitLawb node'}
          </button>
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={!project?.publishedUrl || isRefreshing}
            className="mt-2 w-full border border-zinc-800 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isRefreshing ? 'Refreshing' : 'Refresh status'}
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="mt-2 w-full border border-zinc-800 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:border-zinc-600 hover:text-white"
          >
            Open builder
          </button>
          <div className="mt-4 border-t border-zinc-900 pt-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Full Sandbox (Paid)</div>
            <button
              type="button"
              onClick={() => void onOpenSandbox()}
              disabled={!canPublish || isSandboxing}
              className="w-full border border-zinc-800 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-300 hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSandboxing ? 'Creating sandbox…' : 'Open in CodeSandbox'}
            </button>
            {sandboxUrl && (
              <a
                href={sandboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-center text-[10px] uppercase tracking-widest text-green-500 hover:text-green-400"
              >
                {sandboxUrl}
                <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>
            )}
          </div>
          <div className="mt-4 border-t border-zinc-900 pt-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Fork & Deploy</div>
            <button
              type="button"
              onClick={() => {
                if (!project?.generation) return
                onForkToOpenclaw()
              }}
              disabled={!canPublish}
              className="w-full border border-orange-500/50 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-orange-400 hover:border-orange-400 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Fork to OpenClaw
            </button>
            <p className="mt-2 text-[10px] text-zinc-600">Saves a copy and opens the deploy flow.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function TemplatesView({ onSelect }: { onSelect: (template: Template) => void }) {
  const [category, setCategory] = useState<string>('all')

  const filtered = category === 'all'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === category)

  return (
    <section className="max-w-6xl px-6 py-10">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600">Playground / Templates</div>
        <h1 className="mt-3 text-3xl font-bold uppercase tracking-tighter">Template marketplace</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Start with a pre-built template. Pick one, customise the prompt, and let OpenClaude build it.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors ${
              category === cat.id
                ? 'bg-white text-black'
                : 'border border-zinc-800 text-zinc-500 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className="group border border-zinc-900 bg-black p-5 text-left transition-colors hover:border-zinc-700"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center border border-zinc-800">
                <template.icon className="h-4 w-4 text-zinc-500 group-hover:text-orange-500" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white">{template.title}</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-600">{template.category}</div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">{template.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {template.tags.map((tag) => (
                <span key={tag} className="border border-zinc-900 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-zinc-600">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
