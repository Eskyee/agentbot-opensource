/**
 * Concurrent Tool Orchestration — Phase 3
 *
 * Parallelize read-only tools, serialize write tools.
 * Based on Claude Code's concurrent tool orchestration pattern.
 *
 * Modules:
 * - tool-classifier: Classifies tools as readonly/mutating
 * - batch-partitioner: Groups consecutive readonly tools into parallel batches
 * - concurrent-executor: Executes batches (Promise.all for parallel, sequential for serial)
 */

export { classifyTool, type ToolClassification, type ConcurrencyClass } from './tool-classifier'
export { partitionBatches, getPartitionStats, type ToolCall, type ExecutionBatch, type ClassifiedTool } from './batch-partitioner'
export { executeConcurrent, dryRun, type ToolResult, type ExecutionResult } from './concurrent-executor'
export { executeTool, type ToolExecutionResult } from './tool-executor'
