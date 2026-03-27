/**
 * Embeddings Generation Utility
 *
 * Generates OpenAI embeddings for text content.
 * Supports batching and caching.
 */

interface EmbeddingResponse {
  embedding: number[];
  usage: { prompt_tokens: number; total_tokens: number };
}

/**
 * Generate an embedding for a single text string.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000),
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding failed: ${response.status} ${response.statusText}`);
  }

  const data: { data: EmbeddingResponse[] } = await response.json();
  return data.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a batch.
 * Respects OpenAI's batch limit (max 2048 inputs per request).
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize = 100
): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map((t) => t.substring(0, 8000));

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: batch,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI batch embedding failed: ${response.status}`);
    }

    const data: { data: EmbeddingResponse[] } = await response.json();
    allEmbeddings.push(...data.data.map((d) => d.embedding));
  }

  return allEmbeddings;
}

/**
 * Cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vector dimension mismatch');

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
