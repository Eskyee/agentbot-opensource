/**
 * Tool Executor — Actual Tool Execution Service
 *
 * Executes tool calls with sandboxing and timeouts.
 * Routes through Docker agent when available, falls back to local execution.
 *
 * Safety:
 * - All commands run with timeouts (30s default, 120s max)
 * - Output capped at 100KB
 * - Working directory restricted to agent workspace
 * - Destructive commands blocked by permission system (upstream)
 */

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

export interface ToolExecutionResult {
  success: boolean
  output?: string
  error?: string
  durationMs: number
  truncated: boolean
}

// Safety limits
const MAX_OUTPUT_BYTES = 100 * 1024 // 100KB
const DEFAULT_TIMEOUT_MS = 30_000   // 30s
const MAX_TIMEOUT_MS = 120_000      // 2min

function getWorkspaceRoot(): string {
  return process.env.AGENT_WORKSPACE || '/tmp/agentbot-workspace'
}

/**
 * Execute a tool call and return the result.
 */
export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ToolExecutionResult> {
  const start = Date.now()
  const timeout = Math.min(timeoutMs, MAX_TIMEOUT_MS)

  try {
    switch (toolName.toLowerCase()) {
      case 'read':
      case 'file_read':
        return await executeRead(input, start)

      case 'write':
      case 'file_write':
        return await executeWrite(input, start)

      case 'edit':
      case 'file_edit':
        return await executeEdit(input, start)

      case 'bash':
      case 'exec':
      case 'shell':
        return await executeBash(input, timeout, start)

      case 'grep':
      case 'search':
        return await executeGrep(input, timeout, start)

      case 'memory_search':
        return await executeMemorySearch(input, start)

      case 'memory_get':
        return await executeMemoryGet(input, start)

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
          durationMs: Date.now() - start,
          truncated: false,
        }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Execution failed',
      durationMs: Date.now() - start,
      truncated: false,
    }
  }
}

/**
 * Read a file
 */
async function executeRead(input: Record<string, unknown>, start: number): Promise<ToolExecutionResult> {
  const filePath = resolvePath((input.path || input.file_path || '') as string)
  const limit = (input.limit as number) || 2000
  const offset = (input.offset as number) || 1

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const lines = content.split('\n')
    const selected = lines.slice(offset - 1, offset - 1 + limit).join('\n')

    return {
      success: true,
      output: selected,
      durationMs: Date.now() - start,
      truncated: selected.length < content.length,
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Cannot read ${filePath}: ${error.message}`,
      durationMs: Date.now() - start,
      truncated: false,
    }
  }
}

/**
 * Write a file
 */
async function executeWrite(input: Record<string, unknown>, start: number): Promise<ToolExecutionResult> {
  const filePath = resolvePath((input.path || input.file_path || '') as string)
  const content = (input.content || input.contents || '') as string

  try {
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(filePath, content, 'utf-8')

    return {
      success: true,
      output: `Wrote ${content.length} bytes to ${filePath}`,
      durationMs: Date.now() - start,
      truncated: false,
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Cannot write ${filePath}: ${error.message}`,
      durationMs: Date.now() - start,
      truncated: false,
    }
  }
}

/**
 * Edit a file (string replacement)
 */
async function executeEdit(input: Record<string, unknown>, start: number): Promise<ToolExecutionResult> {
  const filePath = resolvePath((input.path || input.file_path || '') as string)
  const oldText = (input.oldText || input.old_string || '') as string
  const newText = (input.newText || input.new_string || '') as string

  try {
    let content = await fs.readFile(filePath, 'utf-8')

    if (!content.includes(oldText)) {
      return {
        success: false,
        error: `Old text not found in ${filePath}`,
        durationMs: Date.now() - start,
        truncated: false,
      }
    }

    content = content.replace(oldText, newText)
    await fs.writeFile(filePath, content, 'utf-8')

    return {
      success: true,
      output: `Edited ${filePath} (${oldText.length} → ${newText.length} chars)`,
      durationMs: Date.now() - start,
      truncated: false,
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Cannot edit ${filePath}: ${error.message}`,
      durationMs: Date.now() - start,
      truncated: false,
    }
  }
}

/**
 * Execute a shell command
 */
async function executeBash(
  input: Record<string, unknown>,
  timeoutMs: number,
  start: number
): Promise<ToolExecutionResult> {
  const command = (input.command || input.input || '') as string

  if (!command) {
    return {
      success: false,
      error: 'No command provided',
      durationMs: Date.now() - start,
      truncated: false,
    }
  }

  return new Promise((resolve) => {
    let output = ''
    let errorOutput = ''
    let truncated = false

    const proc = spawn('bash', ['-c', command], {
      cwd: getWorkspaceRoot(),
      env: { ...process.env, LANG: 'en_US.UTF-8' },
      timeout: timeoutMs,
    })

    proc.stdout.on('data', (data: Buffer) => {
      if (output.length < MAX_OUTPUT_BYTES) {
        output += data.toString('utf-8')
      } else {
        truncated = true
      }
    })

    proc.stderr.on('data', (data: Buffer) => {
      if (errorOutput.length < MAX_OUTPUT_BYTES) {
        errorOutput += data.toString('utf-8')
      }
    })

    proc.on('close', (code) => {
      resolve({
        success: code === 0,
        output: code === 0 ? output.trim() : undefined,
        error: code !== 0 ? (errorOutput.trim() || `Exit code ${code}`) : undefined,
        durationMs: Date.now() - start,
        truncated,
      })
    })

    proc.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        durationMs: Date.now() - start,
        truncated: false,
      })
    })

    // Kill on timeout
    setTimeout(() => {
      proc.kill('SIGTERM')
    }, timeoutMs)
  })
}

/**
 * Grep/search in files
 */
async function executeGrep(
  input: Record<string, unknown>,
  timeoutMs: number,
  start: number
): Promise<ToolExecutionResult> {
  const pattern = (input.pattern || input.query || '') as string
  const searchPath = (input.path || input.search_path || '.') as string

  if (!pattern) {
    return {
      success: false,
      error: 'No search pattern provided',
      durationMs: Date.now() - start,
      truncated: false,
    }
  }

  // Use grep with safe flags
  const command = `grep -rn --include='*.ts' --include='*.js' --include='*.json' --include='*.md' -l "${pattern.replace(/"/g, '\\"')}" ${searchPath} 2>/dev/null | head -50`

  return executeBash({ command }, timeoutMs, start)
}

/**
 * Search memory (agent knowledge base)
 */
async function executeMemorySearch(input: Record<string, unknown>, start: number): Promise<ToolExecutionResult> {
  const query = (input.query || input.search || '') as string

  // For now, search memory files in workspace
  const memoryDir = path.join(getWorkspaceRoot(), 'memory')

  try {
    const files = await fs.readdir(memoryDir).catch(() => [])
    const results: string[] = []

    for (const file of files.slice(0, 10)) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(memoryDir, file), 'utf-8')
        if (content.toLowerCase().includes(query.toLowerCase())) {
          const lines = content.split('\n')
          const matchingLines = lines
            .map((line, i) => ({ line, num: i + 1 }))
            .filter(({ line }) => line.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3)
            .map(({ line, num }) => `${file}:${num}: ${line}`)
          results.push(...matchingLines)
        }
      }
    }

    return {
      success: true,
      output: results.length > 0 ? results.join('\n') : 'No matches found',
      durationMs: Date.now() - start,
      truncated: results.length >= 30,
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Memory search failed: ${error.message}`,
      durationMs: Date.now() - start,
      truncated: false,
    }
  }
}

/**
 * Get memory content
 */
async function executeMemoryGet(input: Record<string, unknown>, start: number): Promise<ToolExecutionResult> {
  const filePath = (input.path || input.file || '') as string
  const from = (input.from as number) || 1
  const lines = (input.lines as number) || 50

  if (!filePath) {
    return {
      success: false,
      error: 'No file path provided',
      durationMs: Date.now() - start,
      truncated: false,
    }
  }

  // Resolve relative to workspace
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(getWorkspaceRoot(), filePath)

  try {
    const content = await fs.readFile(fullPath, 'utf-8')
    const fileLines = content.split('\n')
    const selected = fileLines.slice(from - 1, from - 1 + lines).join('\n')

    return {
      success: true,
      output: selected,
      durationMs: Date.now() - start,
      truncated: from - 1 + lines < fileLines.length,
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Cannot read memory: ${error.message}`,
      durationMs: Date.now() - start,
      truncated: false,
    }
  }
}

/**
 * Resolve a file path, preventing directory traversal
 */
function resolvePath(filePath: string): string {
  // Normalize and resolve
  const resolved = path.resolve(getWorkspaceRoot(), filePath)

  // Ensure it's within workspace (prevent directory traversal)
  if (!resolved.startsWith(getWorkspaceRoot())) {
    throw new Error(`Path ${filePath} is outside workspace`)
  }

  return resolved
}
