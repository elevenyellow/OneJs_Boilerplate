/**
 * Url Value Object
 * Represents a validated URL
 */
export class Url {
  private constructor(private readonly value: string) {}

  static create(url: string | null | undefined): Url {
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string')
    }

    const trimmed = url.trim()

    if (trimmed.length === 0) {
      throw new Error('URL cannot be empty')
    }

    // Basic URL validation
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      throw new Error('URL must start with http:// or https://')
    }

    return new Url(trimmed)
  }

  /**
   * Create URL for TheCrag source
   */
  static forTheCrag(
    urlStub: string | null | undefined,
    externalId: number,
  ): Url {
    const path = urlStub ?? String(externalId)
    return new Url(`https://www.thecrag.com/climbing/${path}`)
  }

  toString(): string {
    return this.value
  }

  equals(other: Url): boolean {
    return this.value === other.value
  }

  get domain(): string {
    try {
      const url = new URL(this.value)
      return url.hostname
    } catch {
      return ''
    }
  }
}
