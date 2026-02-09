import { describe, it, expect } from 'vitest'
import { sanitize } from './sanitize.js'

describe('sanitize', () => {
  it('removes is_admin from top-level object', () => {
    const out = sanitize({ id: '1', is_admin: true })
    expect(out).toEqual({ id: '1' })
    expect((out as Record<string, unknown>).is_admin).toBeUndefined()
  })

  it('removes is_admin from nested objects', () => {
    const out = sanitize({ user: { name: 'x', is_admin: true } })
    expect(out).toEqual({ user: { name: 'x' } })
  })

  it('removes is_admin from arrays of objects', () => {
    const out = sanitize({ items: [{ id: 1, is_admin: true }, { id: 2 }] })
    expect(out).toEqual({ items: [{ id: 1 }, { id: 2 }] })
  })

  it('leaves other fields unchanged', () => {
    const out = sanitize({ credits_balance: 10, api_key: 'sk-xxx', active_aliases: [] })
    expect(out).toEqual({ credits_balance: 10, api_key: 'sk-xxx', active_aliases: [] })
  })

  it('handles null and arrays without is_admin', () => {
    expect(sanitize(null)).toBe(null)
    expect(sanitize([1, 2])).toEqual([1, 2])
  })
})
