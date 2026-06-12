/**
 * Fast codebase search — deterministic lexical ranker.
 *
 * Cognition's data: coding agents spend ~60% of their time searching, not
 * generating. A cheap, fast search tool that returns the few relevant chunks
 * keeps the big model's context (and bill) small. This is a BM25-flavoured
 * scorer over file chunks: no model call, no embeddings, fully testable. An
 * optional LLM re-rank can layer on later behind the same shape.
 */

export type SearchFile = { path: string; content: string }

export type SearchHit = {
  path: string
  startLine: number
  endLine: number
  score: number
  snippet: string
}

const CHUNK_LINES = 40
const CHUNK_OVERLAP = 10

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length > 1)
}

type Chunk = { path: string; startLine: number; endLine: number; text: string; tokens: string[] }

function chunkFile(file: SearchFile): Chunk[] {
  const lines = file.content.split('\n')
  const chunks: Chunk[] = []
  for (let start = 0; start < lines.length; start += CHUNK_LINES - CHUNK_OVERLAP) {
    const end = Math.min(lines.length, start + CHUNK_LINES)
    const text = lines.slice(start, end).join('\n')
    if (text.trim().length === 0) continue
    chunks.push({ path: file.path, startLine: start + 1, endLine: end, text, tokens: tokenize(text) })
    if (end >= lines.length) break
  }
  return chunks
}

/**
 * Rank chunks across files by relevance to the query. BM25-style term scoring
 * with a filename-match boost and an exact-phrase bonus.
 */
export function searchCode(query: string, files: SearchFile[], opts?: { limit?: number }): SearchHit[] {
  const limit = Math.max(1, Math.min(opts?.limit ?? 8, 50))
  const queryTokens = Array.from(new Set(tokenize(query)))
  if (queryTokens.length === 0) return []

  const chunks: Chunk[] = files.flatMap(chunkFile)
  if (chunks.length === 0) return []

  // Document frequency for IDF
  const df = new Map<string, number>()
  for (const term of queryTokens) {
    let count = 0
    for (const chunk of chunks) if (chunk.tokens.includes(term)) count++
    df.set(term, count)
  }

  const N = chunks.length
  const avgLen = chunks.reduce((s, c) => s + c.tokens.length, 0) / N || 1
  const k1 = 1.5
  const b = 0.75
  const phrase = query.toLowerCase().trim()

  const scored = chunks.map((chunk) => {
    const len = chunk.tokens.length || 1
    let score = 0
    for (const term of queryTokens) {
      const tf = chunk.tokens.filter((t) => t === term).length
      if (tf === 0) continue
      const n = df.get(term) ?? 0
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5))
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * len) / avgLen)))
    }
    // Boosts: filename mention + exact phrase presence
    const pathLower = chunk.path.toLowerCase()
    if (queryTokens.some((t) => pathLower.includes(t))) score *= 1.25
    if (phrase.length > 3 && chunk.text.toLowerCase().includes(phrase)) score *= 1.5
    return { chunk, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk, score }) => ({
      path: chunk.path,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      score: Math.round(score * 1000) / 1000,
      snippet: chunk.text.length > 1200 ? `${chunk.text.slice(0, 1200)}\n…` : chunk.text,
    }))
}
