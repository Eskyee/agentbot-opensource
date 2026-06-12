import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getAuthSession } from '@/app/lib/getAuthSession'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `You are a coding agent inside Agentbot. You have access to tools to read, write, edit, and search files in a repository.

Available tools:
- grep <pattern> <path> — search for patterns in files
- read <file> — read a file's contents
- write <file> <content> — write content to a file
- edit <file> <old> <new> — replace text in a file
- bash <command> — run a shell command

When the user asks you to build something:
1. First grep/read to understand the codebase
2. Then write/edit the necessary files
3. Run bash commands to verify (typecheck, test, etc.)
4. Report what you did

Always output code in fenced code blocks with the language specified.
Be concise but complete. Show tool calls as you make them.`

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

    // Verify session ownership
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

    // Build messages
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    // Stream response from OpenRouter
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
        max_tokens: 4096,
        temperature: 0.3,
        stream: true,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[CodingAgent] OpenRouter error:', err)
      return new Response('AI service error', { status: 502 })
    }

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        let fullContent = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

            for (const line of lines) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  fullContent += content
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }

          // Extract code blocks as files
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

          // Send final message with files
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, files })}\n\n`))

          // Update session in DB
          const meta = (codingSession.metadata as Record<string, unknown>) || {}
          const messages = (meta.messages as Array<{ role: string; content: string }>) || []
          messages.push({ role: 'user', content: message })
          messages.push({ role: 'assistant', content: fullContent })

          await prisma.managedAgentSession.update({
            where: { id: sessionId },
            data: {
              metadata: {
                ...meta,
                messages: messages.slice(-20),
                lastActivity: new Date().toISOString(),
              },
            },
          })
        } catch (error) {
          console.error('[CodingAgent] Stream error:', error)
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
