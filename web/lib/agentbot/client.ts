const API_BASE = process.env.AGENTBOT_API_BASE ?? 'http://localhost:3001'
const API_KEY = process.env.AGENTBOT_API_KEY

export async function agentbotFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Agentbot API error ${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}
