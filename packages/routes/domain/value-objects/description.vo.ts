export class Description {
  private readonly value: string | null
  private readonly htmlValue: string | null

  private constructor(value: string | null, htmlValue: string | null) {
    this.value = value
    this.htmlValue = htmlValue
  }

  static createFrom(
    description: string | null | undefined,
    descriptionHtml: string | null | undefined,
  ): Description {
    return new Description(description?.trim() || null, descriptionHtml?.trim() || null)
  }

  static createEmpty(): Description {
    return new Description(null, null)
  }

  getValue(): string | null {
    return this.value
  }

  getHtmlValue(): string | null {
    return this.htmlValue
  }

  getBestValue(): string | null {
    return this.htmlValue || this.value || null
  }

  hasValue(): boolean {
    return this.value !== null || this.htmlValue !== null
  }

  getWordCount(): number {
    const text = this.getBestValue()
    if (!text) return 0
    return text.split(/\s+/).length
  }

  equals(other: Description): boolean {
    return this.value === other.value && this.htmlValue === other.htmlValue
  }

  toString(): string {
    return this.getBestValue() || ''
  }
}
