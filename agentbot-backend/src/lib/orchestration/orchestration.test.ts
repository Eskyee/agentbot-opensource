/**
 * Tests for Tool Classifier and Batch Partitioner
 */

import { classifyTool } from './tool-classifier'
import { partitionBatches, getPartitionStats } from './batch-partitioner'
import type { ToolCall } from './batch-partitioner'

// ─── Tool Classifier Tests ─────────────────────────────────

describe('classifyTool', () => {
  it('classifies read tools as readonly', () => {
    expect(classifyTool('read', { path: '/test.ts' }).class).toBe('readonly')
    expect(classifyTool('file_read').class).toBe('readonly')
  })

  it('classifies search tools as readonly', () => {
    expect(classifyTool('grep').class).toBe('readonly')
    expect(classifyTool('search').class).toBe('readonly')
    expect(classifyTool('glob').class).toBe('readonly')
  })

  it('classifies memory tools as readonly', () => {
    expect(classifyTool('memory_search').class).toBe('readonly')
    expect(classifyTool('memory_get').class).toBe('readonly')
  })

  it('classifies write tools as mutating', () => {
    expect(classifyTool('write', { path: '/test.ts' }).class).toBe('mutating')
    expect(classifyTool('edit').class).toBe('mutating')
  })

  it('classifies exec tools as mutating by default', () => {
    expect(classifyTool('exec', { command: 'npm install' }).class).toBe('mutating')
    expect(classifyTool('bash').class).toBe('mutating')
    // exec with no command input defaults to mutating
    expect(classifyTool('exec', {}).class).toBe('mutating')
  })

  it('classifies bash with readonly command as readonly', () => {
    expect(classifyTool('bash', { command: 'cat file.txt' }).class).toBe('readonly')
    expect(classifyTool('exec', { command: 'ls -la' }).class).toBe('readonly')
    expect(classifyTool('bash', { command: 'git status' }).class).toBe('readonly')
  })

  it('classifies bash with write command as mutating', () => {
    expect(classifyTool('bash', { command: 'npm install' }).class).toBe('mutating')
    expect(classifyTool('exec', { command: 'git push' }).class).toBe('mutating')
  })

  it('classifies unknown tools as mutating (safe default)', () => {
    expect(classifyTool('unknown_tool').class).toBe('mutating')
  })

  it('normalizes tool names', () => {
    expect(classifyTool('file-read').class).toBe('readonly')
    expect(classifyTool('file-write').class).toBe('mutating')
  })
})

// ─── Batch Partitioner Tests ───────────────────────────────

describe('partitionBatches', () => {
  const mkTool = (id: string, name: string, input = {}): ToolCall => ({
    id,
    toolName: name,
    input,
  })

  it('returns empty array for no tools', () => {
    expect(partitionBatches([])).toEqual([])
  })

  it('groups consecutive readonly tools into parallel batch', () => {
    const tools = [
      mkTool('1', 'read', { path: '/a.ts' }),
      mkTool('2', 'read', { path: '/b.ts' }),
      mkTool('3', 'grep', { pattern: 'foo' }),
    ]

    const batches = partitionBatches(tools)
    expect(batches).toHaveLength(1)
    expect(batches[0].parallel).toBe(true)
    expect(batches[0].tools).toHaveLength(3)
  })

  it('splits on mutating tool', () => {
    const tools = [
      mkTool('1', 'read', { path: '/a.ts' }),
      mkTool('2', 'write', { path: '/b.ts' }),
      mkTool('3', 'read', { path: '/c.ts' }),
    ]

    const batches = partitionBatches(tools)
    expect(batches).toHaveLength(3)
    expect(batches[0].parallel).toBe(true)
    expect(batches[0].tools).toHaveLength(1)
    expect(batches[1].parallel).toBe(false)
    expect(batches[1].tools).toHaveLength(1)
    expect(batches[2].parallel).toBe(true)
    expect(batches[2].tools).toHaveLength(1)
  })

  it('separates consecutive mutating tools', () => {
    const tools = [
      mkTool('1', 'write', { path: '/a.ts' }),
      mkTool('2', 'edit', { path: '/b.ts' }),
    ]

    const batches = partitionBatches(tools)
    expect(batches).toHaveLength(2)
    expect(batches[0].parallel).toBe(false)
    expect(batches[1].parallel).toBe(false)
  })

  it('handles read-mutate-read-mutate pattern', () => {
    const tools = [
      mkTool('1', 'read'),
      mkTool('2', 'read'),
      mkTool('3', 'write'),
      mkTool('4', 'read'),
      mkTool('5', 'write'),
    ]

    const batches = partitionBatches(tools)
    expect(batches).toHaveLength(4)
    // Batch 0: [read, read] — parallel
    expect(batches[0].parallel).toBe(true)
    expect(batches[0].tools).toHaveLength(2)
    // Batch 1: [write] — serial
    expect(batches[1].parallel).toBe(false)
    // Batch 2: [read] — parallel (single)
    expect(batches[2].parallel).toBe(true)
    // Batch 3: [write] — serial
    expect(batches[3].parallel).toBe(false)
  })

  it('classifies bash commands correctly in partitioning', () => {
    const tools = [
      mkTool('1', 'bash', { command: 'cat file.txt' }),
      mkTool('2', 'bash', { command: 'ls -la' }),
      mkTool('3', 'bash', { command: 'npm install' }),
    ]

    const batches = partitionBatches(tools)
    expect(batches).toHaveLength(2)
    expect(batches[0].parallel).toBe(true)
    expect(batches[0].tools).toHaveLength(2)
    expect(batches[1].parallel).toBe(false)
  })
})

describe('getPartitionStats', () => {
  it('returns correct stats', () => {
    const tools = [
      { id: '1', toolName: 'read', input: {} },
      { id: '2', toolName: 'read', input: {} },
      { id: '3', toolName: 'write', input: {} },
    ]

    const batches = partitionBatches(tools)
    const stats = getPartitionStats(batches)

    expect(stats.totalTools).toBe(3)
    expect(stats.parallelBatches).toBe(1)
    expect(stats.serialBatches).toBe(1)
    expect(stats.maxParallelism).toBe(2)
  })
})
