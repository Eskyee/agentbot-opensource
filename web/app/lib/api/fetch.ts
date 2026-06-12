/**
 * safeFetch — fetch with a default timeout so a slow upstream can never hang a
 * serverless function to its max duration.
 *
 *   const res = await safeFetch(url)                 // 10s default
 *   const res = await safeFetch(url, { timeoutMs: 5000 })
 *
 * If the caller already passes a `signal`, it's respected and combined with the
 * timeout. Throws a tagged error on timeout so callers can distinguish it.
 */
type SafeFetchInit = RequestInit & { timeoutMs?: number }

export class FetchTimeoutError extends Error {
  constructor(url: string, ms: number) {
    super(`Request to ${url} timed out after ${ms}ms`)
    this.name = 'FetchTimeoutError'
  }
}

const DEFAULT_TIMEOUT_MS = 10_000

export async function safeFetch(input: string | URL, init: SafeFetchInit = {}): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: callerSignal, ...rest } = init

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  // Honor a caller-supplied signal alongside our timeout
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort()
    else callerSignal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    return await fetch(input, { ...rest, signal: controller.signal })
  } catch (err) {
    if (controller.signal.aborted && !callerSignal?.aborted) {
      throw new FetchTimeoutError(String(input), timeoutMs)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
