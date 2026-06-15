/**
 * readJson — parse a request body safely, returning a typed result instead of
 * throwing. Pairs with the `invalidBody()` responder.
 *
 *   const parsed = await readJson(req)
 *   if (!parsed.ok) return invalidBody()
 *   const { name } = parsed.data
 */
export type JsonResult<T> = { ok: true; data: T } | { ok: false }

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<JsonResult<T>> {
  try {
    const data = (await req.json()) as T
    if (data === null || typeof data !== 'object') return { ok: false }
    return { ok: true, data }
  } catch {
    return { ok: false }
  }
}

/** Coerce an unknown value to a trimmed, length-capped string. */
export function str(value: unknown, fallback = '', maxLen = 5000): string {
  const s = typeof value === 'string' ? value : fallback
  return s.slice(0, maxLen)
}

/** Coerce an unknown value to a finite number within optional bounds. */
export function num(value: unknown, fallback = 0, min = -Infinity, max = Infinity): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}
