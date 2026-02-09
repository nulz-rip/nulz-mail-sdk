import { describe, it, expect, vi } from 'vitest'
import { NulzAPIError } from './errors.js'

describe('NulzAPIError', () => {
  it('parses JSON error body', async () => {
    const res = new Response(JSON.stringify({ error: 'Invalid API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
    const err = await NulzAPIError.fromResponse(res)
    expect(err.message).toBe('Invalid API key')
    expect(err.status).toBe(401)
    expect(err.body).toEqual({ error: 'Invalid API key' })
  })

  it('falls back to statusText when no error in body', async () => {
    const res = new Response('', { status: 404, statusText: 'Not Found' })
    const err = await NulzAPIError.fromResponse(res)
    expect(err.message).toBe('Not Found')
    expect(err.status).toBe(404)
  })

  it('uses raw text when body is not JSON', async () => {
    const res = new Response('Server error', { status: 500 })
    const err = await NulzAPIError.fromResponse(res)
    expect(err.message).toBe('Server error')
  })
})
