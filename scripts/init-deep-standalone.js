#!/usr/bin/env node
/**
 * Standalone init-deep CLI (no TypeScript compilation required)
 *
 * Usage:
 *   node scripts/init-deep-standalone.js              # Generate AGENTS.md files
 *   node scripts/init-deep-standalone.js --dry-run    # Preview only
 *   node scripts/init-deep-standalone.js --force      # Overwrite existing
 *   node scripts/init-deep-standalone.js --status     # Check status
 */

const fs = require('fs')
const path = require('path')

const HASH_LENGTH = 2
const DEFAULT_EXCLUDE = [
  'node_modules', '.git', '.next', 'dist', 'build',
  'coverage', '.vercel', '.turbo', 'prisma/migrations',
]

const PRIORITY_DIRECTORIES = [
  'web/app/api',
  'web/app/lib',
  'web/components',
  'web/app/lib/hashline',
  'agentbot-backend/src',
  'skills',
]

/**
 * Analyze a file to extract metadata
 */
async function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const stats = fs.statSync(filePath)
    const ext = path.extname(filePath)
    const name = path.basename(filePath)

    // Extract imports
    const importMatches = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g) || []
    const imports = importMatches
      .map(m => m.match(/from\s+['"]([^'"]+)['"]/)?.[1])
      .filter(Boolean)

    // Extract exports
    const exportMatches = content.match(/export\s+(?:default\s+)?(?:async\s+)?(?:function|class|interface|type|const|let|var)\s+(\w+)/g) || []
    const exports = exportMatches
      .map(m => m.match(/\s+(\w+)$/)?.[1])
      .filter(Boolean)

    // Infer purpose
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

    return { name, path: filePath, size: stats.size, extension: ext, purpose, exports, imports }
  } catch (e) {
    return { name: path.basename(filePath), path: filePath, size: 0, extension: path.extname(filePath), purpose: 'File', exports: [], imports: [] }
  }
}

/**
 * Analyze a directory
 */
async function analyzeDirectory(dirPath, depth = 0) {
  const name = path.basename(dirPath) || path.dirname(dirPath)
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  const files = []
  const subdirectories = []
  const allImports = new Set()
  const allExports = new Set()

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      if (!DEFAULT_EXCLUDE.includes(entry.name)) {
        subdirectories.push(fullPath)
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))) {
      const fileInfo = await analyzeFile(fullPath)
      files.push(fileInfo)
      fileInfo.imports.forEach(i => allImports.add(i))
      fileInfo.exports.forEach(e => allExports.add(e))
    }
  }

  files.sort((a, b) => {
    const aScore = a.name.includes('index') || a.name.includes('route') ? 2 : a.exports.length > 0 ? 1 : 0
    const bScore = b.name.includes('index') || b.name.includes('route') ? 2 : b.exports.length > 0 ? 1 : 0
    return bScore - aScore
  })

  const conventions = inferConventions(files)
  const dependencies = extractDependencies([...allImports])

  return { path: dirPath, name, depth, files, subdirectories, imports: [...allImports], exports: [...allExports], conventions, dependencies }
}

function inferConventions(files) {
  const conventions = []
  const hasCamelCase = files.some(f => /^[a-z][a-zA-Z0-9]*\.tsx?$/.test(f.name))
  const hasPascalCase = files.some(f => /^[A-Z][a-zA-Z0-9]*\.tsx?$/.test(f.name))
  const hasKebabCase = files.some(f => /^[a-z][a-z0-9-]*\.tsx?$/.test(f.name))

  if (hasCamelCase) conventions.push('Use camelCase for utility files')
  if (hasPascalCase) conventions.push('Use PascalCase for component files')
  if (hasKebabCase) conventions.push('Use kebab-case for route/config files')

  const hasTypeScript = files.some(f => f.extension === '.ts' || f.extension === '.tsx')
  if (hasTypeScript) conventions.push('TypeScript-first: prefer .ts/.tsx over .js')

  const hasTests = files.some(f => f.name.includes('.test.') || f.name.includes('.spec.'))
  if (hasTests) conventions.push('Co-locate tests with source files')

  return conventions
}

function extractDependencies(imports) {
  const deps = new Set()
  for (const imp of imports) {
    if (imp.startsWith('next/')) deps.add('Next.js')
    if (imp.startsWith('react')) deps.add('React')
    if (imp.includes('prisma')) deps.add('Prisma')
    if (imp.includes('stripe')) deps.add('Stripe')
  }
  return [...deps]
}

function generateAgentsMd(context) {
  const lines = []

  lines.push(`# AGENTS.md — ${context.name}`)
  lines.push('')
  lines.push('## Scope')
  lines.push(`This directory contains ${context.files.length} files and ${context.subdirectories.length} subdirectories.`)
  lines.push('')

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

  if (context.files.length > 0) {
    lines.push('## Key Files')
    lines.push('')
    lines.push('| File | Purpose | Exports |')
    lines.push('|------|---------|---------|')

    for (const file of context.files.slice(0, 15)) {
      const exports = file.exports.slice(0, 3).join(', ') || '-'
      const exportDisplay = exports.length > 30 ? exports.slice(0, 27) + '...' : exports
      const purpose = file.purpose.slice(0, 40) + (file.purpose.length > 40 ? '...' : '')
      lines.push(`| ${file.name} | ${purpose} | ${exportDisplay} |`)
    }

    if (context.files.length > 15) {
      lines.push(`| ... | *${context.files.length - 15} more files* | |`)
    }
    lines.push('')
  }

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

  if (context.conventions.length > 0) {
    lines.push('## Conventions')
    lines.push('')
    for (const convention of context.conventions) {
      lines.push(`- ${convention}`)
    }
    lines.push('')
  }

  if (context.dependencies.length > 0) {
    lines.push('## Key Dependencies')
    lines.push('')
    for (const dep of context.dependencies) {
      lines.push(`- ${dep}`)
    }
    lines.push('')
  }

  lines.push('---')
  lines.push(`*Generated by init-deep — ${new Date().toISOString().split('T')[0]}*`)

  return lines.join('\n')
}

async function initDeep(options = {}) {
  const { rootPath = process.cwd(), force = false, dryRun = false, maxDepth = 3 } = options
  const results = []

  const directoriesToProcess = PRIORITY_DIRECTORIES
    .map(d => path.resolve(rootPath, d))
    .filter(d => fs.existsSync(d))

  if (directoriesToProcess.length === 0) {
    directoriesToProcess.push(rootPath)
  }

  for (const dirPath of directoriesToProcess) {
    try {
      const relativePath = path.relative(rootPath, dirPath) || '.'
      console.log(`[init-deep] Analyzing: ${relativePath}`)

      const context = await analyzeDirectory(dirPath)
      const agentsMdPath = path.join(dirPath, 'AGENTS.md')

      if (fs.existsSync(agentsMdPath) && !force) {
        results.push({ path: relativePath, generated: false, skipped: true, error: 'Already exists (use --force to overwrite)' })
        continue
      }

      const content = generateAgentsMd(context)

      if (dryRun) {
        console.log(`[init-deep] Would generate: ${agentsMdPath}`)
        results.push({ path: relativePath, generated: false, skipped: false })
      } else {
        fs.writeFileSync(agentsMdPath, content, 'utf-8')
        console.log(`[init-deep] ✅ Generated: ${agentsMdPath}`)
        results.push({ path: relativePath, generated: true, skipped: false })
      }
    } catch (error) {
      results.push({ path: path.relative(rootPath, dirPath), generated: false, skipped: false, error: error.message })
    }
  }

  return results
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')
  const status = args.includes('--status')

  if (status) {
    console.log('\n📊 AGENTS.md Status\n')
    console.log('='.repeat(60))

    let generated = 0
    let missing = 0

    for (const dir of PRIORITY_DIRECTORIES) {
      const fullPath = path.join(process.cwd(), dir)
      const exists = fs.existsSync(path.join(fullPath, 'AGENTS.md'))
      const icon = exists ? '✅' : '❌'
      const statusText = exists ? 'generated' : 'missing'
      console.log(`${icon} ${dir.padEnd(35)} ${statusText}`)

      if (exists) generated++
      else missing++
    }

    console.log('='.repeat(60))
    console.log(`\nGenerated: ${generated} | Missing: ${missing}`)

    if (missing > 0) {
      console.log('\n💡 Run "node scripts/init-deep-standalone.js" to generate missing files.')
    }
    return
  }

  console.log('\n🚀 Init-Deep: Generating hierarchical AGENTS.md files\n')

  if (dryRun) {
    console.log('(DRY RUN - no files will be written)\n')
  }

  try {
    const results = await initDeep({ rootPath: process.cwd(), force, dryRun, maxDepth: 3 })

    const generated = results.filter(r => r.generated).length
    const skipped = results.filter(r => r.skipped).length
    const errors = results.filter(r => r.error).length

    console.log('\n' + '='.repeat(60))
    console.log('📈 Results:')
    console.log(`  ✅ Generated: ${generated}`)
    console.log(`  ⏭️  Skipped: ${skipped}`)
    console.log(`  ❌ Errors: ${errors}`)
    console.log('='.repeat(60))

    if (errors > 0) {
      console.log('\n❌ Errors:')
      results.filter(r => r.error).forEach(r => {
        console.log(`  ${r.path}: ${r.error}`)
      })
    }

    if (dryRun) {
      console.log('\n⚠️  This was a dry run. No files were written.')
      console.log('Run without --dry-run to generate files.')
    } else if (generated > 0) {
      console.log('\n✨ AGENTS.md files generated successfully!')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
