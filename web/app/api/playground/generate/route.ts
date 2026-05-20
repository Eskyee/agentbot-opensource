import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getClientIP, isRateLimited } from '@/app/lib/security-middleware'

export const runtime = 'nodejs'
export const maxDuration = 60

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

const DEFAULT_MODEL = 'xiaomi/mimo-v2.5-pro'
const GITLAWB_OPENGATEWAY_URL = 'https://opengateway.gitlawb.com/v1/chat/completions'

const ALLOWED_PATHS = new Set([
  '.gitignore',
  'AGENTS.md',
  'bun.lock',
  'index.html',
  'package.json',
  'src/App.tsx',
  'src/index.css',
  'src/main.tsx',
  'src/vite-env.d.ts',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'vercel.json',
  'README.md',
])

const EXAMPLE_PROMPTS = [
  'AI startup landing',
  'Habit tracker',
  'Pipeline CRM',
  'Designer portfolio',
]

function jsonResponse(error: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json({ error, ...details }, { status })
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function safePath(path: string): boolean {
  return ALLOWED_PATHS.has(path) && !path.includes('..') && !path.startsWith('/')
}

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return JSON.parse(trimmed)
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim())
  }

  const first = trimmed.indexOf('{')
  const last = trimmed.lastIndexOf('}')
  if (first >= 0 && last > first) {
    return JSON.parse(trimmed.slice(first, last + 1))
  }

  throw new Error('Model response did not include JSON')
}

function normalizeGeneration(raw: unknown): PlaygroundGeneration {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Generation payload is not an object')
  }

  const value = raw as Record<string, unknown>
  const files = Array.isArray(value.files)
    ? value.files
        .map((file) => file && typeof file === 'object' ? file as Record<string, unknown> : null)
        .filter(Boolean)
        .map((file) => ({
          path: asString(file?.path).trim(),
          language: asString(file?.language, 'text').trim() || 'text',
          content: asString(file?.content),
        }))
        .filter((file) => safePath(file.path) && file.content.trim().length > 0)
    : []

  if (files.length === 0) {
    throw new Error('Generation did not include editable files')
  }

  const previewHtml = asString(value.previewHtml)
  if (!previewHtml.trim()) {
    throw new Error('Generation did not include previewHtml')
  }

  return {
    title: asString(value.title, 'Untitled').slice(0, 80),
    summary: asString(value.summary, 'OpenClaude generated a project draft.').slice(0, 240),
    previewHtml,
    files,
    console: Array.isArray(value.console)
      ? value.console.map((line) => asString(line)).filter(Boolean).slice(0, 8)
      : ['OpenClaude wrote files', 'Preview updated'],
  }
}

function buildSystemPrompt() {
  return `You are OpenClaude inside Agentbot Playground, an app-builder agent inspired by GitLawb Playground.

Return ONLY valid JSON. Do not wrap it in markdown.

Build a small, polished React app from the user's request. Output:
- title: short project title
- summary: one sentence
- previewHtml: a complete standalone HTML document for iframe preview. Inline CSS and JavaScript are allowed. It must visually match the generated React app.
- files: produce a complete Vite React TypeScript project with these paths:
  .gitignore, AGENTS.md, bun.lock, index.html, package.json, src/App.tsx, src/index.css, src/main.tsx, src/vite-env.d.ts, tsconfig.app.json, tsconfig.json, tsconfig.node.json, vite.config.ts, vercel.json
- console: 3-6 concise build log lines

Code requirements:
- Use React hooks where state is needed.
- Keep App.tsx self-contained and readable.
- Keep CSS in src/index.css.
- Use TypeScript 6 safe compiler settings. Do not use deprecated moduleResolution node10/Node. Prefer moduleResolution Bundler for app code.
- Configure vercel.json for a Vite preview deployment with buildCommand npm run build and outputDirectory dist.
- Do not include secrets, external trackers, remote scripts, or network calls.
- Do not use markdown prose outside JSON.
- JSON strings must escape newlines correctly.`
}

function buildUserPrompt(prompt: string) {
  return `Create this app in the playground:\n\n${prompt}\n\nThe examples available in the UI are: ${EXAMPLE_PROMPTS.join(', ')}.`
}

async function generateWithVercelGateway(prompt: string, model: string) {
  const result = await generateText({
    model,
    system: buildSystemPrompt(),
    prompt: buildUserPrompt(prompt),
    temperature: 0.35,
  })

  return normalizeGeneration(extractJson(result.text))
}

async function generateWithGitlawbOpengateway(prompt: string, model: string, apiKey: string) {
  const response = await fetch(GITLAWB_OPENGATEWAY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model.replace(/^xiaomi\//, ''),
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(prompt) },
      ],
      temperature: 0.35,
    }),
    signal: AbortSignal.timeout(55_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`GitLawb Opengateway failed with ${response.status}${text ? `: ${text.slice(0, 300)}` : ''}`)
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('GitLawb Opengateway returned no content')
  }

  return normalizeGeneration(extractJson(content))
}

function localMockGeneration(prompt: string): PlaygroundGeneration {
  const title = prompt.split(/\s+/).filter(Boolean).slice(0, 4).join(' ') || 'Untitled'
  const safeTitle = title.replace(/[<>&"]/g, '')
  const appTsx = `import { useMemo, useState } from 'react'
import './index.css'

const seedItems = ['Research', 'Design', 'Build', 'Review']

export default function App() {
  const [active, setActive] = useState(seedItems[0])
  const progress = useMemo(() => seedItems.indexOf(active) + 1, [active])

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">OpenClaude local draft</p>
        <h1>${safeTitle}</h1>
        <p>${prompt.replace(/`/g, '\\`')}</p>
      </section>
      <section className="panel">
        {seedItems.map((item) => (
          <button key={item} className={item === active ? 'active' : ''} onClick={() => setActive(item)}>
            {item}
          </button>
        ))}
      </section>
      <section className="meter" aria-label="Build progress">
        <span style={{ width: \`\${progress * 25}%\` }} />
      </section>
    </main>
  )
}
`
  const css = `:root {
  color: #fafafa;
  background: #050505;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

.shell {
  min-height: 100vh;
  padding: 56px;
  background: radial-gradient(circle at top right, rgba(249, 115, 22, 0.18), transparent 28%), #050505;
}

.hero {
  max-width: 780px;
}

.eyebrow {
  color: #f97316;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  margin: 12px 0;
  font-size: clamp(42px, 8vw, 92px);
  line-height: 0.95;
  letter-spacing: -0.04em;
}

p {
  color: #a1a1aa;
  line-height: 1.7;
}

.panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1px;
  max-width: 720px;
  margin-top: 44px;
  background: #27272a;
}

button {
  border: 0;
  background: #09090b;
  color: #d4d4d8;
  padding: 22px;
  text-align: left;
  cursor: pointer;
}

button.active {
  color: #050505;
  background: #fafafa;
}

.meter {
  max-width: 720px;
  height: 8px;
  margin-top: 20px;
  background: #18181b;
}

.meter span {
  display: block;
  height: 100%;
  background: #f97316;
}`
  const packageJson = `{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@types/react": "latest",
    "@types/react-dom": "latest"
  }
}
`

  return {
    title: safeTitle,
    summary: 'Local mock generation is enabled for offline playground testing.',
    previewHtml: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><main class="shell"><section class="hero"><p class="eyebrow">OpenClaude local draft</p><h1>${safeTitle}</h1><p>${prompt.replace(/[<>&"]/g, '')}</p></section><section class="panel"><button class="active">Research</button><button>Design</button><button>Build</button><button>Review</button></section><section class="meter"><span style="width:50%"></span></section></main></body></html>`,
    files: [
      { path: '.gitignore', language: 'gitignore', content: 'node_modules\ndist\ndist-ssr\n.DS_Store\n*.local\n.env.local\n.env.*.local\n\n.vscode/*\n!.vscode/extensions.json\n.idea\n' },
      { path: 'AGENTS.md', language: 'markdown', content: '# Playground Project\n\nGenerated by Agentbot OpenClaude Playground.\n\n- Keep app code in `src/App.tsx`.\n- Keep styling in `src/index.css`.\n- Do not commit generated secrets or local environment files.\n' },
      { path: 'bun.lock', language: 'text', content: '# This playground lockfile is a local preview placeholder.\n' },
      { path: 'index.html', language: 'html', content: '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Agentbot Playground</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n' },
      { path: 'package.json', language: 'json', content: packageJson },
      { path: 'src/App.tsx', language: 'tsx', content: appTsx },
      { path: 'src/index.css', language: 'css', content: css },
      { path: 'src/main.tsx', language: 'tsx', content: "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)\n" },
      { path: 'src/vite-env.d.ts', language: 'typescript', content: '/// <reference types="vite/client" />\n' },
      { path: 'tsconfig.app.json', language: 'json', content: '{\n  "compilerOptions": {\n    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["ES2020", "DOM", "DOM.Iterable"],\n    "allowJs": false,\n    "skipLibCheck": true,\n    "esModuleInterop": true,\n    "allowSyntheticDefaultImports": true,\n    "strict": true,\n    "forceConsistentCasingInFileNames": true,\n    "module": "ESNext",\n    "moduleResolution": "Bundler",\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "jsx": "react-jsx"\n  },\n  "include": ["src"]\n}\n' },
      { path: 'tsconfig.json', language: 'json', content: '{\n  "files": [],\n  "references": [\n    { "path": "./tsconfig.app.json" },\n    { "path": "./tsconfig.node.json" }\n  ]\n}\n' },
      { path: 'tsconfig.node.json', language: 'json', content: '{\n  "compilerOptions": {\n    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",\n    "target": "ES2022",\n    "lib": ["ES2023"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n    "moduleResolution": "Bundler",\n    "allowSyntheticDefaultImports": true,\n    "strict": true,\n    "noEmit": true\n  },\n  "include": ["vite.config.ts"]\n}\n' },
      { path: 'vite.config.ts', language: 'typescript', content: "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    host: '0.0.0.0',\n    port: 5173,\n  },\n})\n" },
      { path: 'vercel.json', language: 'json', content: '{\n  "framework": "vite",\n  "buildCommand": "npm run build",\n  "installCommand": "npm install",\n  "outputDirectory": "dist"\n}\n' },
    ],
    console: ['PLAYGROUND_ALLOW_LOCAL_MOCK=1', 'Generated Vite React TS project', 'Wrote 14 files', 'Preview updated'],
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  if (await isRateLimited(ip)) {
    return jsonResponse('Too many requests', 429)
  }

  let body: { prompt?: unknown; model?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return jsonResponse('Invalid JSON body', 400)
  }

  const prompt = asString(body.prompt).trim()
  const model = asString(body.model, DEFAULT_MODEL).trim() || DEFAULT_MODEL

  if (prompt.length < 12) {
    return jsonResponse('Describe the app in at least 12 characters.', 400)
  }
  if (prompt.length > 5000) {
    return jsonResponse('Prompt is too long for the playground.', 400)
  }

  try {
    if (process.env.PLAYGROUND_ALLOW_LOCAL_MOCK === '1') {
      return NextResponse.json({
        provider: 'local-mock',
        model,
        generation: localMockGeneration(prompt),
      })
    }

    if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
      const generation = await generateWithVercelGateway(prompt, model)
      return NextResponse.json({ provider: 'vercel-ai-gateway', model, generation })
    }

    const opengatewayKey = process.env.GITLAWB_OPENGATEWAY_API_KEY || process.env.OPENGATEWAY_API_KEY
    if (opengatewayKey) {
      const generation = await generateWithGitlawbOpengateway(prompt, model, opengatewayKey)
      return NextResponse.json({ provider: 'gitlawb-opengateway', model, generation })
    }

    return jsonResponse('Playground model backend is not configured.', 503, {
      requiredEnv: ['AI_GATEWAY_API_KEY', 'GITLAWB_OPENGATEWAY_API_KEY'],
      localTestEnv: 'Set PLAYGROUND_ALLOW_LOCAL_MOCK=1 only for offline UI testing.',
    })
  } catch (error) {
    console.error('[playground.generate] failed', error)
    return jsonResponse(error instanceof Error ? error.message : 'Generation failed', 502)
  }
}
