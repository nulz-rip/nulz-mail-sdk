# @nulz-rip/mail

Node.js SDK for [Nulz](https://nulz.lol) disposable and alias email. TypeScript, ESM, Node 18+.

**Use for ethical and educational purposes only.**

## Get an API key

1. Go to **[https://nulz.lol/dashboard](https://nulz.lol/dashboard)** and sign up or log in.
2. Copy your **API key** from the dashboard.
3. You get **50 free emails every 24 hours**. Purchase more credits on the dashboard as needed.

## Install

```bash
npm install @nulz-rip/mail
```

## Usage

```ts
import { MailClient } from '@nulz-rip/mail'

const client = new MailClient({
  apiKey: process.env.NULZ_API_KEY!, // from https://nulz.lol/dashboard
  timeoutMs: 30_000, // optional
})

// Create an inbox and get its address
const domains = await client.domains()
const inbox = await client.createInbox({
  prefix: 'test',        // optional
  domain: domains[0],    // optional; omit for a random domain
})
console.log(inbox.id, inbox.address)

// Poll until a message arrives (or timeout)
const msg = await client.waitForMessage(inbox.id, {
  timeoutMs: 60_000,
  pollIntervalMs: 2_000,
  predicate: (m) => m.subject.includes('Verify'), // optional
})
if (msg) console.log(msg.subject, msg.from_addr)

// Or list messages and fetch one
const { messages, total } = await client.listMessages(inbox.id, { limit: 10 })
const full = await client.getMessage(messages[0].id)

// Credits: 50 free per day, or buy more on the dashboard
const { credits_balance } = await client.credits.get()
await client.credits.claimFree()

// Cancel the inbox when done
await client.deleteInbox(inbox.id)
```

## API

- **createInbox(options?)** – Create an alias. Returns `id`, `address`. Options: `prefix`, `domain` (use a value from `domains()`).
- **domains()** – List domains you can use for `createInbox({ domain })`.
- **listInboxes(options?)** – List aliases with pagination. Returns `{ aliases, total }`. Options: `limit` (default 20, max 100), `offset`.
- **getInbox(id)** – Get one alias by ID (id + address, active, etc.).
- **deleteInbox(id)** – Cancel an alias.
- **listMessages(aliasId, options?)** – List messages; `limit`, `offset`.
- **getMessage(id, codeOnly?)** – Full message or code-only (e.g. OTP).
- **waitForMessage(aliasId, options?)** – Poll until a message matches or timeout.
- **me()** – Account info (credits, limits).
- **credits.get()** – Balance and next free-claim time.
- **credits.claimFree()** – Claim daily free credits.

Errors: `NulzAPIError` with `.message`, `.status`, `.body`.

## License

MIT
