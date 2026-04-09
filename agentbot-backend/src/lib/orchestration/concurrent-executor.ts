/**
 * Concurrent Executor — Parallel Read, Serial Write
 *
 * Executes partitioned batches:
 * - Parallel batches: Promise.all (all tools run simultaneously)
 * - Serial batches: sequential await (one at a time)
 *
 * Based on Claude Code's concurrent tool orchestration:
 * "Read-only tools parallelize. Write tools serialize."
 */

import type { ExecutionBatch, ClassifiedTool, ToolCall } from './batch-partitioner'
import { partitionBatches, getPartitionStats } from './batch-partitioner'

export interface ToolResult {
  toolId: string
  toolName: string
  success: boolean
  output?: unknown
  error?: string
  durationMs: number
}

export interface ExecutionResult {
  success: boolean
  results: ToolResult[]
  stats: {
    totalTools: number
    parallelBatches: number
    serialBatches: number
    maxParallelism: number
    totalDurationMs: number
  }
}

type ToolExecutor = (tool: ToolCall) => Promise<unknown>

/**
 * Execute a batch of tool calls with concurrency optimization.
 *
 * @param toolCalls - The tools to execute
 * @param executor - Function that executes a single tool call
 * @returns Results in original order, with timing info
 */
export async function executeConcurrent(
  toolCalls: ToolCall[],
  executor: ToolExecutor
): Promise<ExecutionResult> {
  const batches = partitionBatches(toolCalls)
  const partitionStats = getPartitionStats(batches)
  const results: ToolResult[] = []
  const startTime = Date.now()

  for (const batch of batches) {
    if (batch.parallel) {
      // Parallel execution — all tools in batch run simultaneously
      const batchResults = await Promise.allSettled(
        batch.tools.map(tool => executeSingle(tool, executor))
      )

      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i]
        const tool = batch.tools[i]

        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            toolId: tool.call.id,
            toolName: tool.call.toolName,
            success: false,
            error: result.reason?.message || 'Unknown error',
            durationMs: 0,
          })
        }
      }
    } else {
      // Serial execution — one tool at a time
      for (const tool of batch.tools) {
        const result = await executeSingle(tool, executor)
        results.push(result)

        // If a mutating tool fails, stop the batch
        // (don't continue serial writes after a failure)
        if (!result.success) {
          break
        }
      }
    }
  }

  const totalDurationMs = Date.now() - startTime
  const allSuccess = results.every(r => r.success)

  return {
    success: allSuccess,
    results,
    stats: {
      ...partitionStats,
      totalDurationMs,
    },
  }
}

/**
 * Execute a single tool call with timing.
 */
async function executeSingle(
  tool: ClassifiedTool,
  executor: ToolExecutor
): Promise<ToolResult> {
  const start = Date.now()

  try {
    const output = await executor(tool.call)
    return {
      toolId: tool.call.id,
      toolName: tool.call.toolName,
      success: true,
      output,
      durationMs: Date.now() - start,
    }
  } catch (error: any) {
    return {
      toolId: tool.call.id,
      toolName: tool.call.toolName,
      success: false,
      error: error.message || 'Unknown error',
      durationMs: Date.now() - start,
    }
  }
}

/**
 * Dry run — partition and report without executing.
 * Useful for logging/debugging.
 */
export function dryRun(toolCalls: ToolCall[]): {
  batches: ExecutionBatch[]
  stats: ReturnType<typeof getPartitionStats>
} {
  const batches = partitionBatches(toolCalls)
  const stats = getPartitionStats(batches)
  return { batches, stats }
}
