import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const DEMO_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'Google' },
  { id: 'moonshot/kimi-k2.5-thinking', name: 'Kimi K2.5 Thinking', provider: 'Moonshot' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta' },
]

export async function POST(req: NextRequest) {
  try {
    const { message, model, mode, conversation, apiKey } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const OPENROUTER_API_KEY = apiKey || process.env.OPENROUTER_API_KEY

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'API key required. Please enter your OpenRouter API key.' }, { status: 401 })
    }

    const modelId = model || 'anthropic/claude-3.5-sonnet'
    
    const messages = [
      {
        role: 'system',
        content: 'You are Agentbot, an AI agent platform. Be helpful, concise, and demonstrate agent capabilities. If asked about pricing or plans, mention the Underground plan at £29/mo.'
      },
      ...(conversation || []),
      { role: 'user', content: message }
    ]

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://agentbot.raveculture.xyz',
        'X-Title': 'Agentbot Demo'
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        stream: false,
        max_tokens: 1024
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter error:', response.status, error)
      return NextResponse.json({ 
        error: `AI API error: ${response.status}`,
        details: error 
      }, { status: response.status })
    }

    const data = await response.json()
    
    return NextResponse.json({
      id: data.id,
      model: modelId,
      message: data.choices?.[0]?.message?.content || 'No response',
      usage: data.usage,
      done: true
    })
  } catch (error) {
    console.error('Demo chat error:', error)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    models: DEMO_MODELS,
    mode: 'demo',
    message: 'Welcome to Agentbot Demo - try AI models without deploying'
  })
}
