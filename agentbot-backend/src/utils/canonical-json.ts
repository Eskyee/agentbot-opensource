/**
 * Canonical JSON serialization for cryptographic signing.
 *
 * `JSON.stringify` on the same object can produce different strings depending
 * on insertion order, runtime version, or a single property added in the
 * middle of an object literal. That instability is fatal for signature
 * verification — both sides must agree byte-for-byte on the input.
 *
 * `canonicalJsonStringify` produces a stable form by:
 *   - sorting object keys alphabetically at every depth
 *   - rejecting cycles (would otherwise serialize to ambiguous strings)
 *   - rejecting `undefined` and functions (silently dropped by JSON.stringify
 *     and a frequent source of "signature works locally, fails in prod" bugs)
 *
 * Numbers are serialized via JSON.stringify, so callers must treat large
 * integers (>2^53) as strings before signing.
 */
export function canonicalJsonStringify(value: unknown): string {
  return stringify(value, new WeakSet());
}

function stringify(value: unknown, seen: WeakSet<object>): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`canonicalJsonStringify: non-finite number ${value}`);
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'bigint') {
    // BigInt has no native JSON form; emit as a string so signers agree.
    return JSON.stringify(value.toString());
  }
  if (typeof value === 'undefined' || typeof value === 'function') {
    throw new Error(`canonicalJsonStringify: unsupported value of type ${typeof value}`);
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      throw new Error('canonicalJsonStringify: circular reference');
    }
    seen.add(value);
    const parts = value.map((item) => stringify(item, seen));
    seen.delete(value);
    return `[${parts.join(',')}]`;
  }
  if (typeof value === 'object') {
    if (seen.has(value as object)) {
      throw new Error('canonicalJsonStringify: circular reference');
    }
    seen.add(value as object);
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const parts: string[] = [];
    for (const key of keys) {
      const v = obj[key];
      if (typeof v === 'undefined' || typeof v === 'function') continue;
      parts.push(`${JSON.stringify(key)}:${stringify(v, seen)}`);
    }
    seen.delete(value as object);
    return `{${parts.join(',')}}`;
  }
  throw new Error(`canonicalJsonStringify: unsupported value of type ${typeof value}`);
}
