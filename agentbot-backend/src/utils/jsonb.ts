/**
 * Postgres jsonb helper.
 *
 * Many call sites in services/ build a small object and then `JSON.stringify`
 * it inline before passing to a `pg` parameterized query because the
 * `pg` driver doesn't auto-serialize objects for jsonb columns.
 *
 * Use `toJsonb(value)` instead — it ensures the value is one of:
 *   - a string (passed through verbatim, useful for forwarding pre-encoded
 *     payloads from external sources without re-parsing them)
 *   - serializable JSON (objects, arrays, primitives) — stringified safely
 *
 * For undefined/null inputs we return `null` so the column stays SQL NULL
 * rather than the JSON literal "null". This matches the existing behavior
 * across the codebase.
 */
export function toJsonb(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}
