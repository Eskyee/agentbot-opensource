/**
 * Integration tests for Hashline system
 */

import {
  readWithHashes,
  formatWithHashes,
  applyEdit,
  hashContent,
  parseHashReference,
  StaleLineError,
  getFileStats
} from '@/app/lib/hashline'
import * as fs from 'fs'
import * as path from 'path'

const TEST_FILE = '/tmp/hashline-test.ts'

describe('Hashline System', () => {
  beforeEach(() => {
    fs.writeFileSync(TEST_FILE, `import { x } from 'y'

export function hello() {
  return "world"
}

const unused = 42
`)
  })

  afterEach(() => {
    if (fs.existsSync(TEST_FILE)) {
      fs.unlinkSync(TEST_FILE)
    }
  })

  test('reads file with hashes', () => {
    const lines = readWithHashes(TEST_FILE)

    // The fixture has 7 logical lines plus a trailing newline, which the
    // reader keeps as an 8th empty line.
    expect(lines).toHaveLength(8)
    expect(lines[0].lineNumber).toBe(1)
    expect(lines[0].hash).toHaveLength(2)
    expect(lines[0].content).toBe("import { x } from 'y'")
  })

  test('formats with hashes correctly', () => {
    const lines = readWithHashes(TEST_FILE)
    const formatted = formatWithHashes(lines)
    
    expect(formatted).toContain('1#')
    expect(formatted).toContain("import { x } from 'y'")
    expect(formatted).toContain('| ')
  })

  test('applies edit by hash', () => {
    const lines = readWithHashes(TEST_FILE)
    const targetHash = `${lines[0].lineNumber}#${lines[0].hash}`
    
    const result = applyEdit(TEST_FILE, targetHash, "import { z } from 'y'")
    
    expect(result.success).toBe(true)
    
    const newContent = fs.readFileSync(TEST_FILE, 'utf-8')
    expect(newContent).toContain("import { z } from 'y'")
  })

  test('detects stale line errors', () => {
    // Use a syntactically valid hash that does not match any line in the
    // fixture. `parseHashReference` requires hex chars, so `ZZ` would be
    // rejected by format validation before stale-line detection ran.
    const result = applyEdit(TEST_FILE, '1#FF', 'invalid')

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  test('generates consistent hashes', () => {
    const hash1 = hashContent('test content')
    const hash2 = hashContent('test content')
    
    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(2)
  })

  test('parses hash references', () => {
    const ref1 = parseHashReference('12#A3')
    expect(ref1.lineNumber).toBe(12)
    expect(ref1.hash).toBe('A3')
    
    const ref2 = parseHashReference('#B7')
    expect(ref2.lineNumber).toBeUndefined()
    expect(ref2.hash).toBe('B7')
  })

  test('provides file stats', () => {
    const stats = getFileStats(TEST_FILE)

    expect(stats.totalLines).toBe(8)
    expect(stats.blankLines).toBe(3)
    expect(stats.uniqueHashes).toBeGreaterThan(0)
  })
})
