import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch OpenRouter models
    const res = await fetch('https://openrouter.ai/api/v1/models')
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error')
      console.error('OpenRouter API error:', res.status, errorText)
      return NextResponse.json({ error: 'Failed to fetch models from provider' }, { status: res.status })
    }
    
    const data = await res.json()
    
    if (!data.data) {
      return NextResponse.json({ error: 'Invalid response from provider' }, { status: 500 })
    }
    
    let models = data.data
      .filter((m: any) => !m.id.includes(':free'))
      .map((m: any) => ({
        id: m.id,
        name: m.name,
        contextLength: m.context_length,
        pricing: {
          prompt: parseFloat(m.pricing.prompt),
          completion: parseFloat(m.pricing.completion)
        }
      }))

    // Add Kimi K2.5 Thinking model
    models.push({
      id: 'moonshot/kimi-k2.5-thinking',
      name: 'Kimi K2.5 Thinking',
      contextLength: 128000,
      pricing: {
        prompt: 0.000003,
        completion: 0.000012
      },
      featured: true,
      description: 'Advanced reasoning model with thinking capabilities'
    })

    models = models.sort((a: any, b: any) => {
      if (a.featured) return -1
      if (b.featured) return 1
      return a.pricing.prompt - b.pricing.prompt
    })

    return NextResponse.json({ models })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
  }
}
