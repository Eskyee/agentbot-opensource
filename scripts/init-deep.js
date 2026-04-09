#!/usr/bin/env node
/**
 * CLI tool for init-deep
 *
 * Usage:
 *   node scripts/init-deep.js              # Generate AGENTS.md files
 *   node scripts/init-deep.js --dry-run    # Preview only
 *   node scripts/init-deep.js --force      # Overwrite existing
 *   node scripts/init-deep.js --status     # Check status
 */

const { initDeep, hasAgentsMd, readClosestAgentsMd } = require('../web/app/lib/init-deep')

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')
  const status = args.includes('--status')

  if (status) {
    const path = require('path')
    const fs = require('fs')
    
    const priorityDirs = [
      'web/app/api',
      'web/app/lib',
      'web/components',
      'web/app/lib/hashline',
      'agentbot-backend/src',
      'skills',
    ]

    console.log('\n📊 AGENTS.md Status\n')
    console.log('='.repeat(50))
    
    let generated = 0
    let missing = 0
    
    for (const dir of priorityDirs) {
      const fullPath = path.join(process.cwd(), dir)
      const exists = fs.existsSync(path.join(fullPath, 'AGENTS.md'))
      const icon = exists ? '✅' : '❌'
      const status = exists ? 'generated' : 'missing'
      console.log(`${icon} ${dir.padEnd(30)} ${status}`)
      
      if (exists) generated++
      else missing++
    }
    
    console.log('='.repeat(50))
    console.log(`\nGenerated: ${generated} | Missing: ${missing}`)
    
    if (missing > 0) {
      console.log('\nRun "node scripts/init-deep.js" to generate missing files.')
    }
    
    return
  }

  console.log('\n🚀 Init-Deep: Generating hierarchical AGENTS.md files\n')
  
  if (dryRun) {
    console.log('(DRY RUN - no files will be written)\n')
  }

  try {
    const results = await initDeep({
      rootPath: process.cwd(),
      force,
      dryRun,
      maxDepth: 3,
    })

    const generated = results.filter(r => r.generated).length
    const skipped = results.filter(r => r.skipped).length
    const errors = results.filter(r => r.error).length

    console.log('\n' + '='.repeat(50))
    console.log('Results:')
    console.log(`  ✅ Generated: ${generated}`)
    console.log(`  ⏭️  Skipped: ${skipped}`)
    console.log(`  ❌ Errors: ${errors}`)
    console.log('='.repeat(50))

    if (errors > 0) {
      console.log('\nErrors:')
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
