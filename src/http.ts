// Lightweight fetch wrapper: auth, timeout, JSON, errors.

import { NulzAPIError } from './errors.js'
import { sanitize } from './sanitize.js'

const DEFAULT_BASE = 'https://v1.nulz.lol/v1'
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_UA = 'nulz-mail-sdk/0.1.0'

export interface HttpOptions {
  apiKey: string
  baseUrl?: string
  timeoutMs?: number
  userAgent?: string
}

export async function request<T>(
  opts: HttpOptions,
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string | number | undefined>
): Promise<T> {
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/$/, '')
  const url = new URL(path.startsWith('/') ? path : `/${path}`, base)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
  }

  const headers: Record<string, string> = {
    Authorization: opts.apiKey.startsWith('Bearer ') || opts.apiKey.startsWith('ApiKey ')
      ? opts.apiKey
      : `ApiKey ${opts.apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': opts.userAgent ?? DEFAULT_UA,
  }

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) throw await NulzAPIError.fromResponse(res)

    if (res.status === 204) return undefined as T
    const text = await res.text()
    let raw: T
    try {
      raw = text ? (JSON.parse(text) as T) : (undefined as T)
    } catch {
      throw new NulzAPIError(
        res.headers.get('Content-Type')?.includes('html')
          ? 'Server returned HTML instead of JSON; check baseUrl (e.g. https://v1.nulz.lol/v1)'
          : 'Invalid JSON response',
        res.status,
        { error: text.slice(0, 200) }
      )
    }
    return sanitize(raw)
  } catch (e) {
    clearTimeout(timeoutId)
    if (e instanceof NulzAPIError) throw e
    if (e instanceof Error) {
      if (e.name === 'AbortError') throw new NulzAPIError('Request timeout', 408)
      throw e
    }
    throw e
  }
}
