// Public types matching the Nulz Mail API. 

export interface Inbox {
  id: string
  address: string
  active: boolean
  created_at: string
  cancelled_at?: string | null
}

export interface InboxCreated {
  id: string
  address: string
  active: boolean
  created_at: string
  cost_credits: number
}

export interface MessageSummary {
  id: string
  from_addr: string
  to_addr: string
  subject: string
  received_at: string
}

export interface Message {
  id: string
  alias_id: string
  from_addr: string
  to_addr: string
  subject: string
  body_text: string | null
  body_html: string | null
  raw_rfc822: string | null
  received_at: string
}

export interface CodeOnlyResponse {
  code: string | null
}

export interface MeResponse {
  credits_balance: number
  api_key?: string
  active_aliases: Array<{ id: string; address: string; active: boolean; created_at: string }>
  next_free_claim_at: string | null
  total_messages?: number
  max_messages_per_inbox?: number
  inbox_expire_days?: number
  message_retention_days?: number
}

export interface DomainsResponse {
  domains: string[]
}

export interface AliasesResponse {
  aliases: Inbox[]
}

export interface ListMessagesResponse {
  messages: MessageSummary[]
  total: number
}

export interface ClaimCreditsResponse {
  granted: number
  credits_balance: number
  next_free_claim_at: string | null
}

export interface CreateInboxOptions {
  prefix?: string
  domain?: string
}

export interface ListMessagesOptions {
  limit?: number
  offset?: number
}
