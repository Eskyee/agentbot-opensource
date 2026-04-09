/**
 * Agent Definition — Markdown + YAML Frontmatter Format
 *
 * Adopted from Claude Code's agent file format.
 * Users define agents as .md files with YAML frontmatter.
 *
 * Example:
 *   ---
 *   name: researcher
 *   description: Deep research agent for web analysis
 *   model: openrouter/anthropic/claude-3.5-sonnet
 *   tools: [bash, read, write, web]
 *   permissions:
 *     bash: dangerous  # require approval
 *     read: safe       # auto-approve
 *     write: dangerous
 *   ---
 *   # Researcher Agent
 *
 *   You are a deep research agent...
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs'
import { join, extname } from 'path'

export interface AgentDefinition {
  /** Unique agent name (filename without .md) */
  name: string
  /** Human-readable description */
  description: string
  /** Model to use (e.g., openrouter/anthropic/claude-3.5-sonnet) */
  model: string
  /** Available tools */
  tools: string[]
  /** Per-tool permission overrides */
  permissions: Record<string, 'safe' | 'dangerous' | 'destructive'>
  /** Agent instruction (markdown body) */
  instruction: string
  /** File path where this definition was loaded from */
  source: string
  /** Whether this is a system-provided or user-defined agent */
  scope: 'system' | 'user' | 'project'
}

export interface AgentDefinitionMeta {
  name: string
  description: string
  model: string
  tools: string[]
  scope: 'system' | 'user' | 'project'
  source: string
}

// Default permission by tool
const DEFAULT_PERMISSIONS: Record<string, 'safe' | 'dangerous' | 'destructive'> = {
  bash: 'dangerous',
  exec: 'dangerous',
  shell: 'dangerous',
  read: 'safe',
  write: 'dangerous',
  web: 'dangerous',
  memory: 'safe',
  think: 'safe',
}

/**
 * Parse a markdown file with YAML frontmatter into an AgentDefinition
 */
export function parseAgentDefinition(filePath: string): AgentDefinition | null {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const name = filePath.split('/').pop()?.replace('.md', '') || 'unknown'

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!frontmatterMatch) {
      // No frontmatter — use defaults
      return {
        name,
        description: content.split('\n')[0].replace(/^# /, '').trim() || name,
        model: 'openrouter/auto',
        tools: ['bash', 'read', 'write', 'think'],
        permissions: DEFAULT_PERMISSIONS,
        instruction: content,
        source: filePath,
        scope: 'user',
      }
    }

    const frontmatter = frontmatterMatch[1]
    const body = frontmatterMatch[2]

    // Parse YAML frontmatter (simple key: value parser)
    const meta = parseSimpleYaml(frontmatter)

    return {
      name: (meta.name as string) || name,
      description: (meta.description as string) || body.split('\n').find(l => l.startsWith('# '))?.replace(/^# /, '').trim() || name,
      model: (meta.model as string) || 'openrouter/auto',
      tools: parseList(meta.tools) || ['bash', 'read', 'write', 'think'],
      permissions: parsePermissions(meta.permissions, DEFAULT_PERMISSIONS),
      instruction: body.trim(),
      source: filePath,
      scope: (meta.scope as 'system' | 'user' | 'project') || 'user',
    }
  } catch {
    return null
  }
}

/**
 * Load all agent definitions from a directory
 */
export function loadAgentDefinitions(dirPath: string, scope: 'system' | 'user' | 'project'): AgentDefinition[] {
  if (!existsSync(dirPath)) return []

  const agents: AgentDefinition[] = []
  const files = readdirSync(dirPath)

  for (const file of files) {
    if (extname(file) !== '.md') continue
    const fullPath = join(dirPath, file)
    if (statSync(fullPath).isDirectory()) continue

    const def = parseAgentDefinition(fullPath)
    if (def) {
      def.scope = scope
      agents.push(def)
    }
  }

  return agents
}

/**
 * Load agent definitions from standard locations
 * Priority: project > user > system
 */
export function loadAllAgents(projectDir?: string): AgentDefinition[] {
  const agents = new Map<string, AgentDefinition>()

  // System agents (built-in)
  const systemDir = join(__dirname, 'definitions')
  for (const agent of loadAgentDefinitions(systemDir, 'system')) {
    agents.set(agent.name, agent)
  }

  // User agents (~/.agentbot/agents/)
  const userDir = join(process.env.HOME || '/home/node', '.agentbot', 'agents')
  for (const agent of loadAgentDefinitions(userDir, 'user')) {
    agents.set(agent.name, agent)
  }

  // Project agents (.agentbot/agents/)
  if (projectDir) {
    const projectAgentDir = join(projectDir, '.agentbot', 'agents')
    for (const agent of loadAgentDefinitions(projectAgentDir, 'project')) {
      agents.set(agent.name, agent)
    }
  }

  return Array.from(agents.values())
}

/**
 * Convert definition to lightweight metadata (for listing)
 */
export function toMeta(agent: AgentDefinition): AgentDefinitionMeta {
  return {
    name: agent.name,
    description: agent.description,
    model: agent.model,
    tools: agent.tools,
    scope: agent.scope,
    source: agent.source,
  }
}

// --- Simple YAML parser (handles flat key: value + nested permissions) ---

function parseSimpleYaml(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const lines = text.split('\n')
  let currentKey: string | null = null
  let currentObj: Record<string, string> | null = null

  for (const line of lines) {
    // List value: - item
    if (line.startsWith('- ') && currentKey && Array.isArray(result[currentKey])) {
      (result[currentKey] as string[]).push(line.slice(2).trim())
      continue
    }

    // Nested key: value (indented)
    const nestedMatch = line.match(/^  (\w+):\s*(.+)$/)
    if (nestedMatch && currentObj) {
      currentObj[nestedMatch[1]] = nestedMatch[2].trim()
      continue
    }

    // Top-level key: value
    const match = line.match(/^(\w+):\s*(.*)$/)
    if (match) {
      const key = match[1]
      let value: unknown = match[2].trim()

      // List: [a, b, c] or starts with -
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim())
      } else if (value === '' || value === undefined) {
        // Could be a nested object or list
        currentKey = key
        currentObj = {}
        result[key] = currentObj
        continue
      }

      result[key] = value
      currentKey = null
      currentObj = null
    }
  }

  return result
}

function parseList(value: unknown): string[] | null {
  if (Array.isArray(value)) return value as string[]
  if (typeof value === 'string') return value.split(',').map(s => s.trim())
  return null
}

function parsePermissions(
  value: unknown,
  defaults: Record<string, 'safe' | 'dangerous' | 'destructive'>
): Record<string, 'safe' | 'dangerous' | 'destructive'> {
  const perms = { ...defaults }
  if (typeof value === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value)) {
      if (['safe', 'dangerous', 'destructive'].includes(v as string)) {
        perms[k] = v as 'safe' | 'dangerous' | 'destructive'
      }
    }
  }
  return perms
}
