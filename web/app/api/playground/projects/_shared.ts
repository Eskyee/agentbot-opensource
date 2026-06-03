import type { Prisma } from '@prisma/client'

export type PlaygroundProjectStatus = 'IDLE' | 'PUBLISHED' | 'ARCHIVED'

export type PlaygroundFile = {
  path: string
  language: string
  content: string
}

export type PlaygroundGeneration = {
  title: string
  summary: string
  previewHtml: string
  files: PlaygroundFile[]
  console: string[]
}

export type PlaygroundProjectResponse = {
  id: string
  name: string
  status: PlaygroundProjectStatus
  template: string
  lastActive: string
  publishedUrl?: string
  deploymentProvider?: string
  deploymentId?: string
  deploymentState?: string
  generation: PlaygroundGeneration | null
  provider?: string
  model?: string
  prompt?: string
}

type StoredPlaygroundProject = {
  id: string
  name: string
  status: string
  template: string
  lastActiveAt: Date
  updatedAt: Date
  publishedUrl: string | null
  deploymentProvider: string | null
  deploymentId: string | null
  deploymentState: string | null
  generation: Prisma.JsonValue | null
  provider: string | null
  model: string | null
  prompt: string | null
}

export function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export function normalizeStatus(value: unknown): PlaygroundProjectStatus {
  return value === 'PUBLISHED' || value === 'ARCHIVED' ? value : 'IDLE'
}

export function isMissingPlaygroundProjectTable(error: unknown) {
  const record = error && typeof error === 'object' ? error as { code?: unknown; message?: unknown } : null
  const code = typeof record?.code === 'string' ? record.code : ''
  const message = typeof record?.message === 'string' ? record.message : ''

  return code === 'P2021' || /PlaygroundProject.*does not exist|table .*PlaygroundProject.*does not exist/i.test(message)
}

export function normalizeGeneration(value: unknown): PlaygroundGeneration | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const files = Array.isArray(record.files)
    ? record.files
        .map((file) => file && typeof file === 'object' ? file as Record<string, unknown> : null)
        .filter(Boolean)
        .map((file) => ({
          path: asString(file?.path).slice(0, 180),
          language: asString(file?.language, 'text').slice(0, 40),
          content: asString(file?.content),
        }))
        .filter((file) => file.path.length > 0 && file.content.length > 0)
    : []

  if (files.length === 0) return null

  return {
    title: asString(record.title, 'Untitled').slice(0, 80),
    summary: asString(record.summary, 'OpenClaude generated this project.').slice(0, 240),
    previewHtml: asString(record.previewHtml),
    files,
    console: Array.isArray(record.console)
      ? record.console.map((line) => asString(line)).filter(Boolean).slice(0, 20)
      : [],
  }
}

export function generationToJson(generation: PlaygroundGeneration | null): Prisma.InputJsonValue | undefined {
  if (!generation) return undefined

  const serialized = JSON.stringify(generation)
  if (serialized.length > 1_250_000) {
    throw new Error('Generated project is too large to persist.')
  }

  return JSON.parse(serialized) as Prisma.InputJsonValue
}

export function formatLastActive(date: Date) {
  const elapsed = Math.max(0, Date.now() - date.getTime())
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (elapsed < minute) return 'now'
  if (elapsed < hour) return `${Math.max(1, Math.floor(elapsed / minute))}m ago`
  if (elapsed < day) return `${Math.max(1, Math.floor(elapsed / hour))}h ago`
  return `${Math.max(1, Math.floor(elapsed / day))}d ago`
}

export function serializeProject(project: StoredPlaygroundProject): PlaygroundProjectResponse {
  return {
    id: project.id,
    name: project.name,
    status: normalizeStatus(project.status),
    template: project.template,
    lastActive: formatLastActive(project.lastActiveAt ?? project.updatedAt),
    publishedUrl: project.publishedUrl ?? undefined,
    deploymentProvider: project.deploymentProvider ?? undefined,
    deploymentId: project.deploymentId ?? undefined,
    deploymentState: project.deploymentState ?? undefined,
    generation: normalizeGeneration(project.generation),
    provider: project.provider ?? undefined,
    model: project.model ?? undefined,
    prompt: project.prompt ?? undefined,
  }
}
