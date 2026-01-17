export class AnnotationUrl {
  private readonly value: string | null

  private constructor(value: string | null) {
    this.value = value
  }

  static createFrom(url: string | null | undefined): AnnotationUrl {
    return new AnnotationUrl(url || null)
  }

  static createEmpty(): AnnotationUrl {
    return new AnnotationUrl(null)
  }

  getValue(): string | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  getFullUrl(): string | null {
    if (!this.value) return null
    if (this.value.startsWith('http')) return this.value
    return `https://www.thecrag.com${this.value}`
  }

  equals(other: AnnotationUrl): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value || ''
  }
}
