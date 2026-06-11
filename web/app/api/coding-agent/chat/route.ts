import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `You are a coding agent inside Agentbot. You write code and help users build things.

Rules:
- When the user asks you to build something, write the complete code
- Output code in fenced code blocks with the language specified (e.g. \`\`\`python, \`\`\`javascript, \`\`\`html)
- Always provide working, runnable code
- Keep responses focused and practical
- If asked to run code, explain what it does and how to run it
- You can write HTML, CSS, JavaScript, Python, TypeScript, React, Next.js, APIs, scripts, and more
- For web apps, write a single-file HTML with embedded CSS/JS when possible
- Be concise but complete`

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Build messages array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    // Call OpenClaw gateway or OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Title': 'Agentbot Coding Agent',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        messages,
        max_tokens: 4096,
        temperature: 0.3,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[CodingAgent] OpenRouter error:', err)
      return NextResponse.json({ error: 'AI service error' }, { status: 502 })
    }

    const data = await res.json()
    const response = data.choices?.[0]?.message?.content || 'No response generated.'

    // Extract code blocks as files
    const codeBlocks = response.match(/```(\w+)?\n([\s\S]*?)```/g) || []
    const files = codeBlocks.map((block: string, i: number) => {
      const langMatch = block.match(/```(\w+)?/)
      const lang = langMatch?.[1] || 'txt'
      const content = block.replace(/```\w*\n?/, '').replace(/```$/, '')
      const ext: Record<string, string> = {
        javascript: 'js',
        typescript: 'ts',
        python: 'py',
        html: 'html',
        css: 'css',
        json: 'json',
        bash: 'sh',
        shell: 'sh',
      }
      return {
        name: `output-${i + 1}.${ext[lang] || lang}`,
        content,
      }
    })

    return NextResponse.json({ response, files })
  } catch (error) {
    console.error('[CodingAgent] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
