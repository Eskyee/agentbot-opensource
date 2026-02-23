import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models')
    const data = await res.json()
    
    const models = data.data
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
      .sort((a: any, b: any) => a.pricing.prompt - b.pricing.prompt)

    return NextResponse.json({ models })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
  }
}
