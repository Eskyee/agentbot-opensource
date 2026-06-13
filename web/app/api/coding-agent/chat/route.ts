import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { execSync, spawn } from 'child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, relative, resolve, dirname } from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SANDBOX_BASE = '/tmp/coding-agent'
const MAX_OUTPUT = 8000
const COMMAND_TIMEOUT = 30_000
const MAX_TOOL_ROUNDS = 15

const SYSTEM_PROMPT = `You are a coding agent inside Agentbot. You have real tools to read, write, edit, and search files, and run shell commands.

You MUST use the provided tools to interact with the codebase. Do not describe what you would do — actually do it using the tools.

Workflow:
1. Use list_files and grep_search to understand the codebase structure
2. Use read_file to read relevant files
3. Use write_file or edit_file to make changes
4. Use run_command to verify (typecheck, test, lint)
5. Report what you did

Be concise. Use tools directly. Show results as you work.`

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write content to a file (creates or overwrites)',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' },
          content: { type: 'string', description: 'File content to write' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Replace text in a file (find and replace)',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' },
          old_text: { type: 'string', description: 'Exact text to find' },
          new_text: { type: 'string', description: 'Replacement text' },
        },
        required: ['path', 'old_text', 'new_text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'grep_search',
      description: 'Search for a pattern across files',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Search pattern (regex supported)' },
          path: { type: 'string', description: 'Directory to search in (default: root)' },
          include: { type: 'string', description: 'File glob pattern to filter (e.g. "*.ts")' },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files and directories at a path',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path relative to project root (default: root)' },
          recursive: { type: 'boolean', description: 'List recursively (default: false)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Execute a shell command and return output',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to execute' },
        },
        required: ['command'],
      },
    },
  },
]

function getSandboxDir(sessionId: string): string {
  const dir = join(SANDBOX_BASE, sessionId)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

function safePath(sandboxDir: string, relPath: string): string {
  const resolved = resolve(sandboxDir, relPath)
  if (!resolved.startsWith(sandboxDir)) {
    throw new Error(`Path traversal blocked: ${relPath}`)
  }
  return resolved
}

function truncate(str: string, max = MAX_OUTPUT): string {
  if (str.length <= max) return str
  return str.slice(0, max) + `\n... (truncated, ${str.length} chars total)`
}

function execTool(name: string, args: Record<string, string | boolean | undefined>, sandboxDir: string): string {
  try {
    switch (name) {
      case 'read_file': {
        const p = args.path as string
        if (!p) return 'Error: path required'
        const fullPath = safePath(sandboxDir, p)
        if (!existsSync(fullPath)) return `Error: file not found: ${p}`
        return readFileSync(fullPath, 'utf-8')
      }

      case 'write_file': {
        const p = args.path as string
        const content = args.content as string
        if (!p || content === undefined) return 'Error: path and content required'
        const fullPath = safePath(sandboxDir, p)
        const dir = dirname(fullPath)
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        writeFileSync(fullPath, content, 'utf-8')
        return `Written ${content.length} bytes to ${p}`
      }

      case 'edit_file': {
        const p = args.path as string
        const oldText = args.old_text as string
        const newText = args.new_text as string
        if (!p || oldText === undefined || newText === undefined) return 'Error: path, old_text, and new_text required'
        const fullPath = safePath(sandboxDir, p)
        if (!existsSync(fullPath)) return `Error: file not found: ${p}`
        const current = readFileSync(fullPath, 'utf-8')
        if (!current.includes(oldText)) return `Error: old_text not found in ${p}`
        const updated = current.replace(oldText, newText)
        writeFileSync(fullPath, updated, 'utf-8')
        const count = current.split(oldText).length - 1
        return `Replaced ${count} occurrence(s) in ${p}`
      }

      case 'grep_search': {
        const pattern = args.pattern as string
        const searchPath = (args.path as string) || '.'
        const include = args.include as string | undefined
        if (!pattern) return 'Error: pattern required'
        const dir = safePath(sandboxDir, searchPath)
        const args2 = ['-rn', '--max-count=20', '--max-filesize=1M']
        if (include) args2.push(`--include=${include}`)
        args2.push(pattern, '.')
        const result = execSync(`grep ${args2.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(' ')}`, {
          cwd: dir,
          timeout: 10_000,
          encoding: 'utf-8',
          maxBuffer: 1024 * 1024,
        })
        return truncate(result || 'No matches found')
      }

      case 'list_files': {
        const p = (args.path as string) || '.'
        const recursive = args.recursive === true
        const dir = safePath(sandboxDir, p)
        if (!existsSync(dir)) return `Error: directory not found: ${p}`
        if (recursive) {
          const result = execSync(`find . -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.next/*' | head -200`, {
            cwd: dir,
            timeout: 5_000,
            encoding: 'utf-8',
          })
          return truncate(result)
        }
        const entries = readdirSync(dir, { withFileTypes: true })
        return entries
          .map(e => `${e.isDirectory() ? '📁' : '📄'} ${e.name}`)
          .join('\n') || '(empty directory)'
      }

      case 'run_command': {
        const command = args.command as string
        if (!command) return 'Error: command required'
        const result = execSync(command, {
          cwd: sandboxDir,
          timeout: COMMAND_TIMEOUT,
          encoding: 'utf-8',
          maxBuffer: 1024 * 1024,
          env: { ...process.env, PATH: process.env.PATH },
        })
        return truncate(result || '(no output)')
      }

      default:
        return `Error: unknown tool "${name}"`
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('ETIMEDOUT') || msg.includes('timed out')) {
      return `Error: command timed out after ${COMMAND_TIMEOUT / 1000}s`
    }
    return `Error: ${truncate(msg, 2000)}`
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { message, sessionId, history = [] } = await req.json()

    if (!message || !sessionId) {
      return new Response('Missing message or sessionId', { status: 400 })
    }

    const codingSession = await prisma.managedAgentSession.findUnique({
      where: { id: sessionId },
    })

    if (!codingSession || codingSession.userId !== session.user.id) {
      return new Response('Session not found', { status: 404 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return new Response('API key not configured', { status: 500 })
    }

    const sandboxDir = getSandboxDir(sessionId)
    const meta = (codingSession.metadata as Record<string, unknown>) || {}
    const repo = meta.repo as string | undefined

    // Initialize sandbox from repo if first message and repo is set
    const fileCount = existsSync(sandboxDir) ? readdirSync(sandboxDir).length : 0
    if (fileCount === 0 && repo) {
      try {
        const githubUrl = repo.startsWith('http') ? repo : `https://github.com/${repo}.git`
        execSync(`git clone --depth 1 "${githubUrl}" .`, {
          cwd: sandboxDir,
          timeout: 30_000,
          encoding: 'utf-8',
        })
      } catch (err) {
        // If clone fails (private repo, etc), start with empty sandbox
        console.error('[CodingAgent] Clone failed, starting empty:', err)
      }
    }

    const messages: Array<{ role: string; content: string | null; tool_calls?: unknown[]; tool_call_id?: string; name?: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let toolRound = 0

        try {
          while (toolRound < MAX_TOOL_ROUNDS) {
            toolRound++

            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://agentbot.sh',
                'X-OpenRouter-Title': 'Agentbot',
                'X-OpenRouter-Categories': 'cli-agent,cloud-agent',
              },
              body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4-5',
                messages,
                tools: TOOLS,
                max_tokens: 4096,
                temperature: 0.3,
              }),
            })

            if (!res.ok) {
              const err = await res.text()
              console.error('[CodingAgent] OpenRouter error:', err)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: `\n\nAI service error (${res.status}). Please try again.` })}\n\n`))
              break
            }

            const data = await res.json()
            const choice = data.choices?.[0]
            if (!choice) break

            const assistantMessage = choice.message

            // If the model wants to call tools
            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
              messages.push({
                role: 'assistant',
                content: assistantMessage.content || null,
                tool_calls: assistantMessage.tool_calls,
              })

              // Stream any text content before tool calls
              if (assistantMessage.content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: assistantMessage.content })}\n\n`))
              }

              // Execute each tool call
              for (const toolCall of assistantMessage.tool_calls) {
                const fn = toolCall.function
                const args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments) : fn.arguments

                // Stream tool start event
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  tool_call: {
                    id: toolCall.id,
                    name: fn.name,
                    args,
                    status: 'running',
                  },
                })}\n\n`))

                // Execute the tool
                const result = execTool(fn.name, args, sandboxDir)

                // Stream tool result event
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  tool_result: {
                    id: toolCall.id,
                    name: fn.name,
                    result: truncate(result, 4000),
                    status: 'done',
                  },
                })}\n\n`))

                // Add tool result to messages
                messages.push({
                  role: 'tool',
                  content: result,
                  tool_call_id: toolCall.id,
                  name: fn.name,
                })
              }

              // Continue loop — model will respond with more tool calls or final text
              continue
            }

            // No tool calls — this is the final text response
            if (assistantMessage.content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: assistantMessage.content })}\n\n`))
            }

            // Extract code blocks as files
            const fullContent = assistantMessage.content || ''
            const codeBlocks = fullContent.match(/```(\w+)?\n([\s\S]*?)```/g) || []
            const files = codeBlocks.map((block: string, i: number) => {
              const langMatch = block.match(/```(\w+)?/)
              const lang = langMatch?.[1] || 'txt'
              const content = block.replace(/```\w*\n?/, '').replace(/```$/, '')
              const ext: Record<string, string> = {
                javascript: 'js', typescript: 'ts', python: 'py',
                html: 'html', css: 'css', json: 'json', bash: 'sh', shell: 'sh',
              }
              return { name: `output-${i + 1}.${ext[lang] || lang}`, content }
            })

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, files })}\n\n`))

            // Update session messages in DB
            const dbMessages = (meta.messages as Array<{ role: string; content: string }>) || []
            dbMessages.push({ role: 'user', content: message })
            dbMessages.push({ role: 'assistant', content: fullContent })

            await prisma.managedAgentSession.update({
              where: { id: sessionId },
              data: {
                metadata: {
                  ...meta,
                  messages: dbMessages.slice(-20),
                  lastActivity: new Date().toISOString(),
                },
              },
            })

            break
          }

          if (toolRound >= MAX_TOOL_ROUNDS) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '\n\nReached maximum tool execution rounds. Please continue with a new message.' })}\n\n`))
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, files: [] })}\n\n`))
          }
        } catch (error) {
          console.error('[CodingAgent] Stream error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '\n\nSomething went wrong. Please try again.' })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, files: [] })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[CodingAgent] Chat error:', error)
    return new Response('Internal error', { status: 500 })
  }
}
