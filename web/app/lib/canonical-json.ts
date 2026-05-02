/**
 * Canonical JSON serialization for cryptographic signing.
 *
 * Mirror of `agentbot-backend/src/utils/canonical-json.ts`. Both sides of any
 * signed payload must use the same canonical form or signatures will not
 * verify. See the backend file for the full rationale.
 */
export function canonicalJsonStringify(value: unknown): string {
  return stringify(value, new WeakSet())
}

function stringify(value: unknown, seen: WeakSet<object>): string {
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`canonicalJsonStringify: non-finite number ${value}`)
    }
    return JSON.stringify(value)
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'bigint') {
    return JSON.stringify(value.toString())
  }
  if (typeof value === 'undefined' || typeof value === 'function') {
    throw new Error(`canonicalJsonStringify: unsupported value of type ${typeof value}`)
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new Error('canonicalJsonStringify: circular reference')
    seen.add(value)
    const parts = value.map((item) => stringify(item, seen))
    seen.delete(value)
    return `[${parts.join(',')}]`
  }
  if (typeof value === 'object') {
    if (seen.has(value as object)) throw new Error('canonicalJsonStringify: circular reference')
    seen.add(value as object)
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj).sort()
    const parts: string[] = []
    for (const key of keys) {
      const v = obj[key]
      if (typeof v === 'undefined' || typeof v === 'function') continue
      parts.push(`${JSON.stringify(key)}:${stringify(v, seen)}`)
    }
    seen.delete(value as object)
    return `{${parts.join(',')}}`
  }
  throw new Error(`canonicalJsonStringify: unsupported value of type ${typeof value}`)
}
