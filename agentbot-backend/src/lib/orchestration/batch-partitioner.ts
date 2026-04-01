/**
 * Batch Partitioner — Concurrent Tool Orchestration
 *
 * Takes a list of tool calls and partitions them into execution batches:
 * - Consecutive read-only tools → single parallel batch
 * - Each mutating tool → its own serial batch
 *
 * Example:
 *   [read, grep, exec("cat"), write, read, git_diff] →
 *   [
 *     { parallel: true,  tools: [read, grep, exec("cat")] },
 *     { parallel: false, tools: [write] },
 *     { parallel: true,  tools: [read, git_diff] },
 *   ]
 */

import { classifyTool, type ConcurrencyClass } from './tool-classifier'

export interface ToolCall {
  id: string
  toolName: string
  input: Record<string, unknown>
}

export interface ExecutionBatch {
  parallel: boolean
  tools: ClassifiedTool[]
}

export interface ClassifiedTool {
  call: ToolCall
  class: ConcurrencyClass
  reason: string
}

/**
 * Partition tool calls into execution batches.
 *
 * Rules:
 * 1. Consecutive readonly tools → parallel batch
 * 2. Each mutating tool → serial batch (its own)
 * 3. Two mutating tools adjacent → separate serial batches
 */
export function partitionBatches(toolCalls: ToolCall[]): ExecutionBatch[] {
  if (toolCalls.length === 0) return []

  const classified: ClassifiedTool[] = toolCalls.map(call => {
    const classification = classifyTool(call.toolName, call.input)
    return {
      call,
      class: classification.class,
      reason: classification.reason,
    }
  })

  const batches: ExecutionBatch[] = []
  let currentReadonly: ClassifiedTool[] = []

  for (const tool of classified) {
    if (tool.class === 'readonly') {
      currentReadonly.push(tool)
    } else {
      // Flush readonly batch if we have one
      if (currentReadonly.length > 0) {
        batches.push({
          parallel: true,
          tools: [...currentReadonly],
        })
        currentReadonly = []
      }
      // Mutating tool gets its own serial batch
      batches.push({
        parallel: false,
        tools: [tool],
      })
    }
  }

  // Flush trailing readonly batch
  if (currentReadonly.length > 0) {
    batches.push({
      parallel: true,
      tools: [...currentReadonly],
    })
  }

  return batches
}

/**
 * Get partition stats for logging/monitoring.
 */
export function getPartitionStats(batches: ExecutionBatch[]): {
  totalTools: number
  parallelBatches: number
  serialBatches: number
  maxParallelism: number
  estimatedSpeedup: string
} {
  const totalTools = batches.reduce((sum, b) => sum + b.tools.length, 0)
  const parallelBatches = batches.filter(b => b.parallel).length
  const serialBatches = batches.filter(b => !b.parallel).length
  const maxParallelism = Math.max(...batches.map(b => b.tools.length), 1)

  // Rough speedup estimate: serial steps vs batched steps
  const batchCount = batches.length
  const estimatedSpeedup = batchCount > 0
    ? `${((totalTools / batchCount) * 100).toFixed(0)}%`
    : '0%'

  return {
    totalTools,
    parallelBatches,
    serialBatches,
    maxParallelism,
    estimatedSpeedup,
  }
}
