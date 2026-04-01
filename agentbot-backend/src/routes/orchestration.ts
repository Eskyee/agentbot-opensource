/**
 * Backend Orchestration Batch Endpoint
 *
 * Receives tool calls, partitions into batches, executes concurrently.
 * POST /api/orchestration/batch
 */

import { Router, Request, Response } from 'express'
import { executeConcurrent, partitionBatches, getPartitionStats, type ToolCall } from '../lib/orchestration'
import { executeTool } from '../lib/orchestration/tool-executor'

const router = Router()

interface BatchRequest {
  tools: ToolCall[]
  userId: string
}

/**
 * POST /api/orchestration/batch
 *
 * Execute a batch of tool calls with concurrent optimization.
 * Read-only tools run in parallel, mutating tools serialize.
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { tools, userId } = req.body as BatchRequest

    if (!tools || !Array.isArray(tools) || tools.length === 0) {
      return res.status(400).json({ error: 'tools array required' })
    }

    if (tools.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 tools per batch' })
    }

    // Get partition stats for dry run info
    const batches = partitionBatches(tools)
    const stats = getPartitionStats(batches)

    // Execute with concurrent optimization + real tool execution
    const result = await executeConcurrent(tools, async (tool) => {
      return executeTool(tool.toolName, tool.input)
    })

    // Log for monitoring
    console.log(`[Orchestration] User ${userId}: ${stats.totalTools} tools, ${stats.parallelBatches} parallel batches, ${stats.serialBatches} serial, duration ${result.stats.totalDurationMs}ms`)

    return res.json({
      result,
      partition: {
        batches: batches.length,
        ...stats,
      },
    })
  } catch (error: any) {
    console.error('[Orchestration]', error)
    return res.status(500).json({ error: error.message || 'Internal error' })
  }
})

/**
 * POST /api/orchestration/partition
 *
 * Dry run — partition tool calls without executing.
 * Useful for debugging and monitoring.
 */
router.post('/partition', async (req: Request, res: Response) => {
  try {
    const { tools } = req.body as { tools: ToolCall[] }

    if (!tools || !Array.isArray(tools)) {
      return res.status(400).json({ error: 'tools array required' })
    }

    const batches = partitionBatches(tools)
    const stats = getPartitionStats(batches)

    return res.json({ batches, stats })
  } catch (error: any) {
    console.error('[Orchestration Partition]', error)
    return res.status(500).json({ error: error.message || 'Internal error' })
  }
})

export default router
