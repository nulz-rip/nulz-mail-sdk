// Strip is_admin from any response. Recursive over objects and arrays.

const FORBIDDEN_KEYS = new Set(['is_admin'])

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(k)) continue
      out[k] = sanitizeValue(v)
    }
    return out
  }
  return value
}

export function sanitize<T>(data: T): T {
  return sanitizeValue(data) as T
}
