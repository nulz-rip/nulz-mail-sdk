import { describe, it, expect, beforeAll } from 'vitest'
import { MailClient, NulzAPIError } from '../index.js'

const apiKey = process.env.NULZ_API_KEY
const baseUrl = process.env.NULZ_BASE_URL
const debug = process.env.NULZ_DEBUG === '1' || process.env.DEBUG?.includes('nulz')

function log(...args: unknown[]) {
  if (debug) console.log('[nulz integration]', ...args)
}

describe(
  'MailClient integration',
  { skip: !apiKey, timeout: 20_000 },
  () => {
    let client: MailClient
    let inboxId: string | null = null
    let skipDelete = false

    beforeAll(async () => {
      const effectiveBase = baseUrl ?? 'https://v1.nulz.lol/v1 (default)'
      log('baseUrl:', baseUrl ? `${baseUrl.replace(/[a-z0-9]{8,}/gi, '***')}` : effectiveBase)
      client = new MailClient({
        apiKey: apiKey!,
        ...(baseUrl && { baseUrl }),
        timeoutMs: 15_000,
      })
      await client.credits.claimFree().catch((e) => log('claimFree:', (e as Error).message))
      try {
        const created = await client.createInbox()
        inboxId = created.id
        log('createInbox ok, inboxId:', inboxId, 'address:', created.address)
      } catch (e) {
        const msg = e instanceof NulzAPIError ? e.message : (e as Error).message
        log('createInbox failed:', msg)
        if (msg.includes('max active aliases reached')) {
          const { aliases: list } = await client.listInboxes({ limit: 50 })
          const active = list.filter((a) => a.active)
          if (active.length > 0) {
            inboxId = active[0].id
            skipDelete = true
            log('using existing inbox for tests (skip delete):', inboxId)
          }
        }
        if (!inboxId) inboxId = null
      }
    })

    it('me() and domains() return data', async () => {
      const me = await client.me()
      expect(typeof me.credits_balance).toBe('number')
      expect((me as unknown as Record<string, unknown>).is_admin).toBeUndefined()
      const domains = await client.domains()
      expect(Array.isArray(domains)).toBe(true)
      log('me credits:', me.credits_balance, 'domains:', domains.length)
    })

    it('credits.get() returns balance', async () => {
      const credits = await client.credits.get()
      expect(typeof credits.credits_balance).toBe('number')
      log('credits_balance:', credits.credits_balance)
    })

    it.skipIf(() => !inboxId)('creates inbox and lists it', async () => {
      expect(inboxId).toBeTruthy()
      const { aliases: list } = await client.listInboxes({ limit: 50 })
      expect(list.some((a) => a.id === inboxId)).toBe(true)
      const inboxInList = list.find((a) => a.id === inboxId)
      log('inbox in list:', inboxId, 'address:', inboxInList?.address)
    })

    it.skipIf(() => !inboxId)('lists messages for inbox', async () => {
      const { messages, total } = await client.listMessages(inboxId!, { limit: 5 })
      expect(Array.isArray(messages)).toBe(true)
      expect(typeof total).toBe('number')
      log('messages:', messages.length, 'total:', total)
    })

    it.skipIf(() => !inboxId || skipDelete)('deletes inbox', async () => {
      await client.deleteInbox(inboxId!)
      const { aliases: list } = await client.listInboxes({ limit: 100 })
      const found = list.find((a) => a.id === inboxId)
      expect(found?.active).toBe(false)
      log('deleted:', inboxId, 'active:', found?.active)
    })
  }
)
