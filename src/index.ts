import { request } from './http.js'
import type { HttpOptions } from './http.js'
import type {
  Inbox,
  InboxCreated,
  Message,
  MessageSummary,
  CodeOnlyResponse,
  MeResponse,
  DomainsResponse,
  ListMessagesResponse,
  ClaimCreditsResponse,
  CreateInboxOptions,
  ListMessagesOptions,
  ListInboxesOptions,
} from './types.js'

export * from './types.js'
export { NulzAPIError } from './errors.js'
export { sanitize } from './sanitize.js'

export interface MailClientOptions {
  apiKey: string
  baseUrl?: string
  timeoutMs?: number
  userAgent?: string
}

export interface WaitForMessageOptions {
  timeoutMs?: number
  pollIntervalMs?: number
  predicate?: (msg: MessageSummary) => boolean
}

export class MailClient {
  private opts: HttpOptions

  constructor(options: MailClientOptions) {
    this.opts = {
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
      timeoutMs: options.timeoutMs,
      userAgent: options.userAgent,
    }
  }

  async createInbox(options?: CreateInboxOptions): Promise<InboxCreated> {
    return request<InboxCreated>(this.opts, 'POST', '/aliases', options ?? {})
  }

  async listInboxes(options?: ListInboxesOptions): Promise<{ aliases: Inbox[]; total: number }> {
    const query: Record<string, number | undefined> = {}
    if (options?.limit != null) query.limit = options.limit
    if (options?.offset != null) query.offset = options.offset
    const res = await request<{ aliases: Inbox[]; total: number }>(
      this.opts,
      'GET',
      '/aliases',
      undefined,
      Object.keys(query).length ? query : undefined
    )
    return { aliases: res?.aliases ?? [], total: res?.total ?? 0 }
  }

  async getInbox(id: string): Promise<Inbox> {
    return request<Inbox>(this.opts, 'GET', `/aliases/${encodeURIComponent(id)}`)
  }

  async deleteInbox(id: string): Promise<void> {
    await request<void>(this.opts, 'DELETE', `/aliases/${encodeURIComponent(id)}`)
  }

  async listMessages(
    aliasId: string,
    options?: ListMessagesOptions
  ): Promise<ListMessagesResponse> {
    const query: Record<string, number | undefined> = {}
    if (options?.limit != null) query.limit = options.limit
    if (options?.offset != null) query.offset = options.offset
    return request<ListMessagesResponse>(
      this.opts,
      'GET',
      `/aliases/${encodeURIComponent(aliasId)}/messages`,
      undefined,
      query
    )
  }

  async getMessage(messageId: string, codeOnly = false): Promise<Message | CodeOnlyResponse> {
    const query = codeOnly ? { code_only: '1' } : undefined
    return request<Message | CodeOnlyResponse>(
      this.opts,
      'GET',
      `/messages/${encodeURIComponent(messageId)}`,
      undefined,
      query
    )
  }

  async waitForMessage(
    aliasId: string,
    options: WaitForMessageOptions = {}
  ): Promise<MessageSummary | null> {
    const timeoutMs = options.timeoutMs ?? 60_000
    const pollIntervalMs = options.pollIntervalMs ?? 2_000
    const predicate = options.predicate ?? (() => true)
    const deadline = Date.now() + timeoutMs

    while (Date.now() < deadline) {
      const { messages } = await this.listMessages(aliasId, { limit: 50 })
      const match = messages.find(predicate)
      if (match) return match
      await new Promise((r) => setTimeout(r, pollIntervalMs))
    }
    return null
  }

  async me(): Promise<MeResponse> {
    return request<MeResponse>(this.opts, 'GET', '/me')
  }

  async domains(): Promise<string[]> {
    const res = await request<DomainsResponse>(this.opts, 'GET', '/domains')
    return res?.domains ?? []
  }

  credits = {
    get: async () => {
      const me = await request<MeResponse>(this.opts, 'GET', '/me')
      return {
        credits_balance: me.credits_balance,
        next_free_claim_at: me.next_free_claim_at ?? null,
      }
    },
    claimFree: async (): Promise<ClaimCreditsResponse> => {
      return request<ClaimCreditsResponse>(this.opts, 'POST', '/credits/claim')
    },
  }
}
