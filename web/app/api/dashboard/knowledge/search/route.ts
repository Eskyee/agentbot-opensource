import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const query = req.nextUrl.searchParams.get('q')
  const agentId = req.nextUrl.searchParams.get('agentId')

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 })
  }

  try {
    const where: Record<string, unknown> = {
      userId: session.user.id,
      status: 'ready',
    }
    if (agentId) where.agentId = agentId

    const docs = await prisma.knowledgeDocument.findMany({
      where,
      select: { id: true, name: true, content: true, type: true },
    })

    // Simple text-based search across document contents
    // TODO: Replace with vector similarity search once embeddings are generated
    const results: { docName: string; chunk: string; score: number; metadata: Record<string, unknown> | null }[] = []
    const queryLower = query.toLowerCase()

    for (const doc of docs) {
      if (!doc.content) continue
      try {
        const content = Buffer.from(doc.content).toString('utf-8')

        // Split into chunks (paragraphs or ~500 char segments)
        const chunks = content.split(/\n\n+/).filter((c) => c.trim().length > 50)

        for (const chunk of chunks) {
          const chunkLower = chunk.toLowerCase()
          // Simple relevance scoring
          const words = queryLower.split(/\s+/).filter((w) => w.length > 2)
          const matches = words.filter((w) => chunkLower.includes(w)).length
          const score = words.length > 0 ? matches / words.length : 0

          if (score > 0.2) {
            results.push({
              docName: doc.name,
              chunk: chunk.slice(0, 500),
              score: Math.min(1, score),
              metadata: { docId: doc.id, type: doc.type },
            })
          }
        }
      } catch {
        // Skip unreadable files
      }
    }

    // Sort by score, return top 10
    results.sort((a, b) => b.score - a.score)
    return NextResponse.json(results.slice(0, 10))
  } catch (error) {
    console.error('[Knowledge Search API] Error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
