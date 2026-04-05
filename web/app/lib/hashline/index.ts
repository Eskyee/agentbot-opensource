/**
 * hashline.ts — Content-addressed file editing system
 *
 * Prevents stale-line errors by using content hashes instead of line numbers.
 * Inspired by Oh My OpenAgent's hash-anchored edit tool.
 *
 * Usage:
 *   const lines = readWithHashes('/path/to/file.ts')
 *   // lines[0] = { lineNumber: 1, hash: 'A3', content: 'import { x } from "y"' }
 *
 *   // Format for AI display:
 *   const formatted = formatWithHashes(lines)
 *   // "1#A3| import { x } from \"y\""
 *
 *   // Apply edit by hash:
 *   applyEdit('/path/to/file.ts', 'A3', 'import { z } from "y"')
 */

import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

/** Hash length - using 2 chars gives 256 possible hashes, enough for small files */
export const HASH_LENGTH = 2

/** Separator between line number and hash */
export const HASH_SEPARATOR = '#'

/** Separator between hash marker and content */
export const CONTENT_SEPARATOR = '| '

export interface HashedLine {
  /** 1-based line number */
  lineNumber: number
  /** Short content hash (first N chars of SHA256) */
  hash: string
  /** Line content (including original newline) */
  content: string
  /** Whether this is a blank line */
  isBlank: boolean
}

export interface EditResult {
  success: boolean
  lineNumber?: number
  oldContent?: string
  newContent?: string
  error?: string
}

export class StaleLineError extends Error {
  constructor(
    public readonly targetHash: string,
    public readonly filePath: string,
    public readonly availableHashes: string[]
  ) {
    super(
      `Hash ${targetHash} not found in ${filePath}. ` +
        `File may have changed. Available hashes: ${availableHashes.slice(0, 10).join(', ')}${
          availableHashes.length > 10 ? '...' : ''
        }`
    )
    this.name = 'StaleLineError'
  }
}

export class HashCollisionError extends Error {
  constructor(
    public readonly hash: string,
    public readonly matches: HashedLine[]
  ) {
    super(
      `Hash collision detected: ${hash} matches ${matches.length} lines. ` +
        `Use longer hash length or edit by line number + hash combination.`
    )
    this.name = 'HashCollisionError'
  }
}

/**
 * Generate a short hash from content
 */
export function hashContent(content: string, length: number = HASH_LENGTH): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
    .slice(0, length)
    .toUpperCase()
}

/**
 * Read a file and return lines with their hashes
 */
export function readWithHashes(filePath: string): HashedLine[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  return lines.map((line, idx) => ({
    lineNumber: idx + 1,
    hash: hashContent(line),
    content: line,
    isBlank: line.trim() === '',
  }))
}

/**
 * Format lines with hash markers for AI display
 * Output format: "12#A3| const x = 5"
 */
export function formatWithHashes(
  lines: HashedLine[],
  options: {
    /** Include line numbers (default: true) */
    showLineNumbers?: boolean
    /** Include hashes (default: true) */
    showHashes?: boolean
    /** Highlight blank lines (default: false) */
    markBlankLines?: boolean
  } = {}
): string {
  const { showLineNumbers = true, showHashes = true, markBlankLines = false } = options

  return lines
    .map((line) => {
      const parts: string[] = []

      if (showLineNumbers) {
        parts.push(String(line.lineNumber).padStart(4, ' '))
      }

      if (showHashes) {
        parts.push(`${HASH_SEPARATOR}${line.hash}`)
      }

      if (parts.length > 0) {
        parts.push(CONTENT_SEPARATOR)
      }

      let content = line.content
      if (markBlankLines && line.isBlank) {
        content = '␣'.repeat(content.length || 1)
      }

      return parts.join('') + content
    })
    .join('\n')
}

/**
 * Parse a hash reference from a formatted line
 * Supports: "12#A3| content" or "12#A3" or "#A3"
 */
export function parseHashReference(ref: string): {
  lineNumber?: number
  hash: string
} {
  // Match patterns like "12#A3|", "12#A3", "#A3", "#A3|"
  const match = ref.match(/^(?:(\d+))?#([A-F0-9]+)(?:\||$)/)
  if (!match) {
    throw new Error(`Invalid hash reference format: ${ref}. Expected format: "12#A3" or "#A3"`)
  }

  return {
    lineNumber: match[1] ? parseInt(match[1], 10) : undefined,
    hash: match[2],
  }
}

/**
 * Find a line by its hash
 * Returns the first match or throws if not found
 */
export function findByHash(lines: HashedLine[], hash: string): HashedLine {
  const matches = lines.filter((l) => l.hash === hash)

  if (matches.length === 0) {
    const availableHashes = [...new Set(lines.map((l) => l.hash))]
    throw new StaleLineError(hash, '', availableHashes)
  }

  if (matches.length > 1) {
    throw new HashCollisionError(hash, matches)
  }

  return matches[0]
}

/**
 * Find a line by line number and hash (disambiguates collisions)
 */
export function findByLineAndHash(
  lines: HashedLine[],
  lineNumber: number,
  hash: string
): HashedLine {
  const match = lines.find((l) => l.lineNumber === lineNumber && l.hash === hash)

  if (!match) {
    const line = lines.find((l) => l.lineNumber === lineNumber)
    if (line) {
      throw new StaleLineError(
        `${lineNumber}#${hash}`,
        '',
        lines.map((l) => `${l.lineNumber}#${l.hash}`)
      )
    }
    throw new Error(`Line ${lineNumber} not found`)
  }

  return match
}

/**
 * Apply an edit to a file using hash reference
 */
export function applyEdit(
  filePath: string,
  hashRef: string,
  newContent: string,
  options: {
    /** Verify content hasn't changed (default: true) */
    verifyHash?: boolean
    /** Create backup before editing (default: true) */
    backup?: boolean
  } = {}
): EditResult {
  const { verifyHash = true, backup = true } = options

  try {
    const lines = readWithHashes(filePath)
    const { lineNumber, hash } = parseHashReference(hashRef)

    let targetLine: HashedLine

    if (lineNumber !== undefined && hash) {
      // Use both for disambiguation
      targetLine = findByLineAndHash(lines, lineNumber, hash)
    } else if (hash) {
      // Use hash only
      targetLine = findByHash(lines, hash)
    } else {
      throw new Error('Must provide either hash or lineNumber#hash')
    }

    // Verify hash if requested
    if (verifyHash) {
      const currentHash = hashContent(targetLine.content)
      if (currentHash !== targetLine.hash) {
        throw new StaleLineError(
          hash,
          filePath,
          lines.map((l) => l.hash)
        )
      }
    }

    // Create backup
    if (backup) {
      const backupPath = `${filePath}.backup.${Date.now()}`
      fs.copyFileSync(filePath, backupPath)
    }

    // Apply edit
    lines[targetLine.lineNumber - 1].content = newContent

    // Write back
    const newFileContent = lines.map((l) => l.content).join('\n')
    fs.writeFileSync(filePath, newFileContent, 'utf-8')

    return {
      success: true,
      lineNumber: targetLine.lineNumber,
      oldContent: targetLine.content,
      newContent,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Apply multiple edits atomically (all succeed or none)
 */
export function applyEdits(
  filePath: string,
  edits: Array<{
    hashRef: string
    newContent: string
  }>,
  options: {
    backup?: boolean
  } = {}
): EditResult[] {
  const { backup = true } = options

  // Validate all edits first
  const lines = readWithHashes(filePath)
  const results: EditResult[] = []

  for (const edit of edits) {
    try {
      const { lineNumber, hash } = parseHashReference(edit.hashRef)

      if (lineNumber !== undefined && hash) {
        findByLineAndHash(lines, lineNumber, hash)
      } else {
        findByHash(lines, hash)
      }

      results.push({ success: true })
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // If any validation failed, don't apply
  if (results.some((r) => !r.success)) {
    return results
  }

  // Create backup
  if (backup) {
    const backupPath = `${filePath}.backup.${Date.now()}`
    fs.copyFileSync(filePath, backupPath)
  }

  // Apply all edits (in reverse line order to maintain positions)
  const sortedEdits = [...edits].sort((a, b) => {
    const aLine = parseHashReference(a.hashRef).lineNumber || 0
    const bLine = parseHashReference(b.hashRef).lineNumber || 0
    return bLine - aLine
  })

  for (const edit of sortedEdits) {
    const { lineNumber, hash } = parseHashReference(edit.hashRef)
    const line = lineNumber !== undefined ? lines[lineNumber - 1] : findByHash(lines, hash)
    line.content = edit.newContent
  }

  // Write back
  const newFileContent = lines.map((l) => l.content).join('\n')
  fs.writeFileSync(filePath, newFileContent, 'utf-8')

  return edits.map((e) => ({
    success: true,
    lineNumber: parseHashReference(e.hashRef).lineNumber,
    newContent: e.newContent,
  }))
}

/**
 * Find similar lines when a hash isn't found (fuzzy matching)
 */
export function findSimilarLines(
  lines: HashedLine[],
  targetContent: string,
  threshold: number = 0.8
): HashedLine[] {
  // Simple similarity: lines containing similar words
  const targetWords = new Set(targetContent.toLowerCase().split(/\s+/))

  return lines
    .map((line) => {
      const lineWords = new Set(line.content.toLowerCase().split(/\s+/))
      const intersection = new Set([...targetWords].filter((w) => lineWords.has(w)))
      const similarity = intersection.size / Math.max(targetWords.size, lineWords.size)
      return { line, similarity }
    })
    .filter((item) => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .map((item) => item.line)
}

/**
 * Get file statistics with hash information
 */
export function getFileStats(filePath: string): {
  totalLines: number
  blankLines: number
  uniqueHashes: number
  hashCollisions: number
} {
  const lines = readWithHashes(filePath)
  const hashCounts = new Map<string, number>()

  for (const line of lines) {
    hashCounts.set(line.hash, (hashCounts.get(line.hash) || 0) + 1)
  }

  const collisions = [...hashCounts.values()].filter((c) => c > 1).length

  return {
    totalLines: lines.length,
    blankLines: lines.filter((l) => l.isBlank).length,
    uniqueHashes: hashCounts.size,
    hashCollisions: collisions,
  }
}

/**
 * CLI-compatible output for hashline display
 */
export function cliFormat(filePath: string): string {
  const lines = readWithHashes(filePath)
  const stats = getFileStats(filePath)

  let output = `// ${filePath} (${stats.totalLines} lines, ${stats.uniqueHashes} unique hashes)\n`
  if (stats.hashCollisions > 0) {
    output += `// Warning: ${stats.hashCollisions} hash collisions detected\n`
  }
  output += formatWithHashes(lines)

  return output
}
