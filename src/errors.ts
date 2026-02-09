// Typed API errors from non-2xx responses.

export class NulzAPIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: { error?: string }
  ) {
    super(message)
    this.name = 'NulzAPIError'
  }

  static async fromResponse(res: Response): Promise<NulzAPIError> {
    let body: { error?: string } = {}
    const text = await res.text()
    if (text) {
      try {
        body = JSON.parse(text) as { error?: string }
      } catch {
        body = { error: text }
      }
    }
    const msg = body.error ?? res.statusText ?? `HTTP ${res.status}`
    return new NulzAPIError(msg, res.status, body)
  }
}
