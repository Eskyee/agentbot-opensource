import { NextResponse } from 'next/server'
import { scanSkillMarketplaceInput } from '@/app/lib/skillMarketplaceSafety'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const scan = scanSkillMarketplaceInput({
      name: typeof body?.name === 'string' ? body.name : '',
      description: typeof body?.description === 'string' ? body.description : '',
      code: typeof body?.code === 'string' ? body.code : '',
      author: typeof body?.author === 'string' ? body.author : '',
      featured: Boolean(body?.featured),
      sourceUrl: typeof body?.sourceUrl === 'string' ? body.sourceUrl : null,
    })

    return NextResponse.json({ scan })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify skill' },
      { status: 500 }
    )
  }
}
