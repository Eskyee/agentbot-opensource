/**
 * init-deep.ts — Hierarchical AGENTS.md generation
 *
 * Generates scoped AGENTS.md files throughout the project for better
 * context management. Inspired by Oh My OpenAgent's /init-deep command.
 *
 * Usage:
 *   import { initDeep } from '@/app/lib/init-deep'
 *   await initDeep('/path/to/project')
 *
 * Or via API:
 *   POST /api/init-deep
 *   Body: { path?: string, force?: boolean }
 */

import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { glob } from 'glob'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)

export interface InitDeepOptions {
  /** Root path to start from (default: current working directory) */
  rootPath?: string
  /** Overwrite existing AGENTS.md files (default: false) */
  force?: boolean
  /** Max depth to traverse (default: 5) */
  maxDepth?: number
  /** Directories to exclude */
  exclude?: string[]
  /** Only generate for these directories */
  include?: string[]
  /** Dry run - show what would be generated */
  dryRun?: boolean
}

export interface DirectoryContext {
  path: string
  name: string
  depth: number
  files: FileInfo[]
  subdirectories: string[]
  imports: string[]
  exports: string[]
  conventions: string[]
  dependencies: string[]
}

export interface FileInfo {
  name: string
  path: string
  size: number
  extension: string
  purpose: string
  exports: string[]
  imports: string[]
}

export interface GenerationResult {
  path: string
  generated: boolean
  skipped: boolean
  error?: string
}

const DEFAULT_EXCLUDE = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.vercel',
  '.turbo',
  'prisma/migrations',
]

const PRIORITY_DIRECTORIES = [
  'web/app/api',
  'web/app/lib',
  'web/components',
  'web/app/hooks',
  'web/app/types',
  'agentbot-backend/src',
  'agentbot-backend/src/services',
  'agentbot-backend/src/routes',
  'skills',
]

/**
 * Analyze a file to extract metadata
 */
async function analyzeFile(filePath: string): Promise<FileInfo> {
  const content = await readFile(filePath, 'utf-8').catch(() => '')
  const stats = await stat(filePath)
  const ext = path.extname(filePath)
  const name = path.basename(filePath)

  // Extract imports
  const importMatches = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g) || []
  const imports = importMatches
    .map((m) => m.match(/from\s+['"]([^'"]+)['"]/)?.[1])
    .filter((m): m is string => Boolean(m))

  // Extract exports
  const exportMatches =
    content.match(/export\s+(?:default\s+)?(?:async\s+)?(?:function|class|interface|type|const|let|var)\s+(\w+)/g) ||
    []
  const exports = exportMatches
    .map((m) => m.match(/\s+(\w+)$/)?.[1])
    .filter((m): m is string => Boolean(m))

  // Infer purpose from comments or exports
  let purpose = 'Utility module'
  const jsdocMatch = content.match(/\/\*\*\s*\n\s*\*\s+([^\n]+)/)
  if (jsdocMatch) {
    purpose = jsdocMatch[1].trim()
  } else if (name.includes('route')) {
    purpose = 'API route handler'
  } else if (name.includes('test')) {
    purpose = 'Test suite'
  } else if (exports.length > 0) {
    purpose = `Exports: ${exports.slice(0, 3).join(', ')}${exports.length > 3 ? '...' : ''}`
  }

  return {
    name,
    path: filePath,
    size: stats.size,
    extension: ext,
    purpose,
    exports,
    imports,
  }
}

/**
 * Analyze a directory to extract context
 */
async function analyzeDirectory(dirPath: string, depth: number = 0): Promise<DirectoryContext> {
  const name = path.basename(dirPath) || path.dirname(dirPath)
  const entries = await readdir(dirPath, { withFileTypes: true })

  const files: FileInfo[] = []
  const subdirectories: string[] = []
  const allImports: Set<string> = new Set()
  const allExports: Set<string> = new Set()

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      if (!DEFAULT_EXCLUDE.includes(entry.name)) {
        subdirectories.push(fullPath)
      }
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))
    ) {
      const fileInfo = await analyzeFile(fullPath)
      files.push(fileInfo)
      fileInfo.imports.forEach((i) => allImports.add(i))
      fileInfo.exports.forEach((e) => allExports.add(e))
    }
  }

  // Sort files by importance
  files.sort((a, b) => {
    // Prioritize index files and route files
    const aScore = a.name.includes('index') || a.name.includes('route') ? 2 : a.exports.length > 0 ? 1 : 0
    const bScore = b.name.includes('index') || b.name.includes('route') ? 2 : b.exports.length > 0 ? 1 : 0
    return bScore - aScore
  })

  return {
    path: dirPath,
    name,
    depth,
    files,
    subdirectories,
    imports: [...allImports],
    exports: [...allExports],
    conventions: inferConventions(files),
    dependencies: extractDependencies([...allImports]),
  }
}

/**
 * Infer coding conventions from file patterns
 */
function inferConventions(files: FileInfo[]): string[] {
  const conventions: string[] = []

  // Check naming patterns
  const hasCamelCase = files.some((f) => /^[a-z][a-zA-Z0-9]*\.tsx?$/.test(f.name))
  const hasPascalCase = files.some((f) => /^[A-Z][a-zA-Z0-9]*\.tsx?$/.test(f.name))
  const hasKebabCase = files.some((f) => /^[a-z][a-z0-9-]*\.tsx?$/.test(f.name))

  if (hasCamelCase) conventions.push('Use camelCase for utility files')
  if (hasPascalCase) conventions.push('Use PascalCase for component files')
  if (hasKebabCase) conventions.push('Use kebab-case for route/config files')

  // Check for TypeScript
  const hasTypeScript = files.some((f) => f.extension === '.ts' || f.extension === '.tsx')
  if (hasTypeScript) conventions.push('TypeScript-first: prefer .ts/.tsx over .js')

  // Check for tests
  const hasTests = files.some((f) => f.name.includes('.test.') || f.name.includes('.spec.'))
  if (hasTests) conventions.push('Co-locate tests with source files')

  // Check export patterns
  const hasDefaultExports = files.some((f) => f.exports.includes('default'))
  if (hasDefaultExports) conventions.push('Use named exports preferentially over default exports')

  return conventions
}

/**
 * Extract key dependencies from imports
 */
function extractDependencies(imports: string[]): string[] {
  const deps = new Set<string>()

  for (const imp of imports) {
    if (imp.startsWith('next/')) deps.add('Next.js')
    if (imp.startsWith('react')) deps.add('React')
    if (imp.startsWith('@prisma')) deps.add('Prisma')
    if (imp.includes('stripe')) deps.add('Stripe')
    if (imp.includes('@coinbase')) deps.add('Coinbase SDK')
  }

  return [...deps]
}

/**
 * Generate AGENTS.md content for a directory
 */
function generateAgentsMd(context: DirectoryContext, parentContext?: DirectoryContext): string {
  const lines: string[] = []

  // Header
  lines.push(`# AGENTS.md — ${context.name}`)
  lines.push('')

  // Scope
  lines.push('## Scope')
  lines.push(`This directory contains ${context.files.length} files and ${context.subdirectories.length} subdirectories.`)
  lines.push('')

  // Purpose inference
  if (context.path.includes('api')) {
    lines.push('This is an **API routes** directory. Each file defines HTTP endpoints.')
  } else if (context.path.includes('components')) {
    lines.push('This is a **React components** directory. Each file exports UI components.')
  } else if (context.path.includes('lib')) {
    lines.push('This is a **shared utilities** directory. Each file exports helper functions.')
  } else if (context.path.includes('skills')) {
    lines.push('This is an **AI skills** directory. Each file defines agent capabilities.')
  } else {
    lines.push(`Primary focus: ${context.exports.slice(0, 5).join(', ') || 'General utilities'}`)
  }
  lines.push('')

  // Key Files
  if (context.files.length > 0) {
    lines.push('## Key Files')
    lines.push('')
    lines.push('| File | Purpose | Exports |')
    lines.push('|------|---------|---------|')

    for (const file of context.files.slice(0, 15)) {
      const exports = file.exports.slice(0, 3).join(', ') || '-'
      const exportDisplay = exports.length > 30 ? exports.slice(0, 27) + '...' : exports
      lines.push(`| ${file.name} | ${file.purpose.slice(0, 40)}${file.purpose.length > 40 ? '...' : ''} | ${exportDisplay} |`)
    }

    if (context.files.length > 15) {
      lines.push(`| ... | *${context.files.length - 15} more files* | |`)
    }

    lines.push('')
  }

  // Subdirectories
  if (context.subdirectories.length > 0) {
    lines.push('## Subdirectories')
    lines.push('')
    for (const subdir of context.subdirectories.slice(0, 10)) {
      const name = path.basename(subdir)
      lines.push(`- **${name}/** — See ${name}/AGENTS.md`)
    }
    if (context.subdirectories.length > 10) {
      lines.push(`- *${context.subdirectories.length - 10} more...*`)
    }
    lines.push('')
  }

  // Conventions
  if (context.conventions.length > 0) {
    lines.push('## Conventions')
    lines.push('')
    for (const convention of context.conventions) {
      lines.push(`- ${convention}`)
    }
    lines.push('')
  }

  // Dependencies
  if (context.dependencies.length > 0) {
    lines.push('## Key Dependencies')
    lines.push('')
    for (const dep of context.dependencies) {
      lines.push(`- ${dep}`)
    }
    lines.push('')
  }

  // Related Context
  if (parentContext) {
    lines.push('## Parent Context')
    lines.push(`See: ${path.relative(context.path, parentContext.path) || '../'}/AGENTS.md`)
    lines.push('')
  }

  // Footer
  lines.push('---')
  lines.push(`*Generated by init-deep — ${new Date().toISOString().split('T')[0]}*`)

  return lines.join('\n')
}

/**
 * Generate root-level AGENTS.md with project overview
 */
function generateRootAgentsMd(context: DirectoryContext): string {
  const lines: string[] = []

  lines.push('# AGENTS.md — Agentbot Project')
  lines.push('')
  lines.push('## Project Overview')
  lines.push('')
  lines.push('Agentbot is an AI agent platform for the music and culture industry.')
  lines.push('It provides:')
  lines.push('- Multi-platform bot deployment (Telegram, Discord, WhatsApp)')
  lines.push('- AI-powered chat with specialized personalities')
  lines.push('- Skills system for extensible capabilities')
  lines.push('- Stripe billing with subscription tiers')
  lines.push('- Blockchain integration (Base network)')
  lines.push('')

  lines.push('## Directory Structure')
  lines.push('')
  lines.push('```')
  lines.push('agentbot/')
  lines.push('├── web/                     # Next.js frontend & API')
  lines.push('│   ├── app/api/            # API routes')
  lines.push('│   ├── app/lib/            # Shared utilities')
  lines.push('│   ├── components/         # React components')
  lines.push('│   └── app/lib/hashline/   # Hash-anchored editing')
  lines.push('├── agentbot-backend/       # Express backend')
  lines.push('├── skills/                 # AI skill definitions')
  lines.push('└── docs/                   # Documentation')
  lines.push('```')
  lines.push('')

  lines.push('## Quick Reference')
  lines.push('')
  lines.push('- **Tech Stack:** Next.js 16, TypeScript, Prisma, PostgreSQL')
  lines.push('- **Deployment:** Vercel (web), Railway (backend)')
  lines.push('- **AI Integration:** OpenClaw Gateway, OpenAI, Anthropic')
  lines.push('- **Auth:** NextAuth.js with multiple providers')
  lines.push('- **Payments:** Stripe with webhook handling')
  lines.push('')

  lines.push('## Conventions')
  lines.push('')
  lines.push('- Prefer TypeScript-first route handlers')
  lines.push('- Use Zod for validation')
  lines.push('- Prefer server-rendered metrics over client-only')
  lines.push('- Keep edits aligned with existing patterns')
  lines.push('')

  lines.push('## Scoped Context')
  lines.push('')
  for (const subdir of context.subdirectories) {
    const name = path.basename(subdir)
    if (fs.existsSync(path.join(subdir, 'AGENTS.md'))) {
      lines.push(`- **${name}/** — See ${name}/AGENTS.md`)
    }
  }
  lines.push('')

  lines.push('---')
  lines.push(`*Generated by init-deep — ${new Date().toISOString().split('T')[0]}*`)

  return lines.join('\n')
}

/**
 * Main init-deep function
 */
export async function initDeep(options: InitDeepOptions = {}): Promise<GenerationResult[]> {
  const {
    rootPath = process.cwd(),
    force = false,
    maxDepth = 5,
    exclude = [],
    include,
    dryRun = false,
  } = options

  const results: GenerationResult[] = []
  const allExcludes = [...DEFAULT_EXCLUDE, ...exclude]

  // Collect directories to process
  let directoriesToProcess: string[] = []

  if (include && include.length > 0) {
    // Use specified directories
    directoriesToProcess = include
      .map((d) => path.resolve(rootPath, d))
      .filter((d) => fs.existsSync(d))
  } else {
    // Use priority directories that exist
    directoriesToProcess = PRIORITY_DIRECTORIES.map((d) => path.resolve(rootPath, d)).filter(
      (d) => fs.existsSync(d)
    )

    // Add root if no priority dirs found
    if (directoriesToProcess.length === 0) {
      directoriesToProcess = [rootPath]
    }
  }

  // Always include root
  if (!directoriesToProcess.includes(rootPath)) {
    directoriesToProcess.unshift(rootPath)
  }

  // Process each directory
  for (const dirPath of directoriesToProcess) {
    try {
      const relativePath = path.relative(rootPath, dirPath) || '.'
      console.log(`[init-deep] Analyzing: ${relativePath}`)

      const context = await analyzeDirectory(dirPath)
      const agentsMdPath = path.join(dirPath, 'AGENTS.md')

      // Check if already exists
      if (fs.existsSync(agentsMdPath) && !force) {
        results.push({
          path: relativePath,
          generated: false,
          skipped: true,
          error: 'Already exists (use force: true to overwrite)',
        })
        continue
      }

      // Generate content
      const content =
        dirPath === rootPath
          ? generateRootAgentsMd(context)
          : generateAgentsMd(context, undefined)

      if (dryRun) {
        console.log(`[init-deep] Would generate: ${agentsMdPath}`)
        results.push({
          path: relativePath,
          generated: false,
          skipped: false,
        })
      } else {
        await writeFile(agentsMdPath, content, 'utf-8')
        results.push({
          path: relativePath,
          generated: true,
          skipped: false,
        })
        console.log(`[init-deep] Generated: ${agentsMdPath}`)
      }

      // Process subdirectories (within maxDepth)
      if (context.depth < maxDepth) {
        for (const subdir of context.subdirectories) {
          if (!allExcludes.includes(path.basename(subdir))) {
            try {
              const subContext = await analyzeDirectory(subdir, context.depth + 1)
              const subAgentsMdPath = path.join(subdir, 'AGENTS.md')

              if (fs.existsSync(subAgentsMdPath) && !force) {
                results.push({
                  path: path.relative(rootPath, subdir),
                  generated: false,
                  skipped: true,
                })
                continue
              }

              const subContent = generateAgentsMd(subContext, context)

              if (dryRun) {
                console.log(`[init-deep] Would generate: ${subAgentsMdPath}`)
              } else {
                await writeFile(subAgentsMdPath, subContent, 'utf-8')
                console.log(`[init-deep] Generated: ${subAgentsMdPath}`)
              }

              results.push({
                path: path.relative(rootPath, subdir),
                generated: !dryRun,
                skipped: false,
              })
            } catch (error) {
              results.push({
                path: path.relative(rootPath, subdir),
                generated: false,
                skipped: false,
                error: error instanceof Error ? error.message : String(error),
              })
            }
          }
        }
      }
    } catch (error) {
      results.push({
        path: path.relative(rootPath, dirPath),
        generated: false,
        skipped: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}

/**
 * Check if a directory has an AGENTS.md file
 */
export function hasAgentsMd(dirPath: string): boolean {
  return fs.existsSync(path.join(dirPath, 'AGENTS.md'))
}

/**
 * Read the closest AGENTS.md for context
 */
export function readClosestAgentsMd(filePath: string): string | null {
  let currentDir = path.dirname(filePath)
  const root = path.parse(currentDir).root

  while (currentDir !== root) {
    const agentsMdPath = path.join(currentDir, 'AGENTS.md')
    if (fs.existsSync(agentsMdPath)) {
      return fs.readFileSync(agentsMdPath, 'utf-8')
    }
    currentDir = path.dirname(currentDir)
  }

  return null
}
