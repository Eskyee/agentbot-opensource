import { log } from "../lib/logger";
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

// `bash`/`exec`/`shell` hand an arbitrary string to a shell on the backend
// host. Driving them from an HTTP request body is remote code execution, so
// they are rejected unless an operator explicitly opts in for a trusted,
// single-tenant deployment.
const SHELL_TOOLS = new Set(['bash', 'exec', 'shell'])
const SHELL_TOOLS_ENABLED = process.env.ORCHESTRATION_ALLOW_SHELL === 'true'

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

    // Validate tool shape and reject shell tools before executing anything.
    for (const tool of tools) {
      if (!tool || typeof tool.toolName !== 'string' || !tool.toolName.trim()) {
        return res.status(400).json({ error: 'Each tool must have a non-empty string toolName' })
      }
      if (!SHELL_TOOLS_ENABLED && SHELL_TOOLS.has(tool.toolName.toLowerCase())) {
        return res.status(400).json({
          error: `Tool '${tool.toolName}' is not permitted via the orchestration API`,
          code: 'TOOL_NOT_PERMITTED',
        })
      }
    }

    // Get partition stats for dry run info
    const batches = partitionBatches(tools)
    const stats = getPartitionStats(batches)

    // Execute with concurrent optimization + real tool execution
    const result = await executeConcurrent(tools, async (tool) => {
      return executeTool(tool.toolName, tool.input)
    })

    // Log for monitoring
    log.info(`[Orchestration] User ${userId}: ${stats.totalTools} tools, ${stats.parallelBatches} parallel batches, ${stats.serialBatches} serial, duration ${result.stats.totalDurationMs}ms`)

    return res.json({
      result,
      partition: {
        batches: batches.length,
        ...stats,
      },
    })
  } catch (error: unknown) {
    log.error('[Orchestration]', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Internal error'
    return res.status(500).json({ error: message })
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
  } catch (error: unknown) {
    log.error('[Orchestration Partition]', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Internal error'
    return res.status(500).json({ error: message })
  }
})

export default router
