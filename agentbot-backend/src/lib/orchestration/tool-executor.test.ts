/**
 * Tests for Tool Executor
 */

import { executeTool } from './tool-executor'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

let testDir: string

beforeAll(async () => {
  testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentbot-executor-test-'))
  // Override workspace for tests
  process.env.AGENT_WORKSPACE = testDir
})

afterAll(async () => {
  await fs.rm(testDir, { recursive: true, force: true })
})

describe('executeTool', () => {
  describe('read', () => {
    it('reads an existing file', async () => {
      await fs.writeFile(path.join(testDir, 'test.txt'), 'hello world')
      const result = await executeTool('read', { path: 'test.txt' })
      expect(result.success).toBe(true)
      expect(result.output).toBe('hello world')
      expect(result.truncated).toBe(false)
    })

    it('returns error for missing file', async () => {
      const result = await executeTool('read', { path: 'nonexistent.txt' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Cannot read')
    })

    it('blocks directory traversal', async () => {
      const result = await executeTool('read', { path: '../../../etc/passwd' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('outside workspace')
    })
  })

  describe('write', () => {
    it('writes a file', async () => {
      const result = await executeTool('write', { path: 'output.txt', content: 'test content' })
      expect(result.success).toBe(true)
      expect(result.output).toContain('12 bytes')

      const content = await fs.readFile(path.join(testDir, 'output.txt'), 'utf-8')
      expect(content).toBe('test content')
    })

    it('creates directories as needed', async () => {
      const result = await executeTool('write', { path: 'subdir/nested/file.txt', content: 'nested' })
      expect(result.success).toBe(true)
    })
  })

  describe('bash', () => {
    it('executes a simple command', async () => {
      const result = await executeTool('bash', { command: 'echo hello' })
      expect(result.success).toBe(true)
      expect(result.output).toBe('hello')
    })

    it('captures stderr on failure', async () => {
      const result = await executeTool('bash', { command: 'ls /nonexistent-path-12345' })
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('handles timeout', async () => {
      const result = await executeTool('bash', { command: 'sleep 60' }, 1000)
      expect(result.success).toBe(false)
      expect(result.durationMs).toBeLessThan(5000)
    }, 10000)
  })

  describe('edit', () => {
    it('replaces text in a file', async () => {
      await fs.writeFile(path.join(testDir, 'edit.txt'), 'old text here')
      const result = await executeTool('edit', {
        path: 'edit.txt',
        oldText: 'old',
        newText: 'new',
      })
      expect(result.success).toBe(true)

      const content = await fs.readFile(path.join(testDir, 'edit.txt'), 'utf-8')
      expect(content).toBe('new text here')
    })

    it('fails when old text not found', async () => {
      await fs.writeFile(path.join(testDir, 'edit2.txt'), 'some content')
      const result = await executeTool('edit', {
        path: 'edit2.txt',
        oldText: 'not found',
        newText: 'replacement',
      })
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('unknown tool', () => {
    it('returns error for unknown tools', async () => {
      const result = await executeTool('unknown_tool', {})
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unknown tool')
    })
  })
})
