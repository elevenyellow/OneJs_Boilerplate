export class Approach {
  private readonly value: string | null

  private constructor(value: string | null) {
    this.value = value
  }

  static createFrom(approach: string | null | undefined): Approach {
    if (!approach || approach.trim() === '') {
      return Approach.createEmpty()
    }
    return new Approach(approach.trim())
  }

  static createEmpty(): Approach {
    return new Approach(null)
  }

  getValue(): string | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  getWordCount(): number {
    if (!this.value) return 0
    return this.value.split(/\s+/).length
  }

  getReadingTimeMinutes(): number {
    // Aproximadamente 200 palabras por minuto
    return Math.ceil(this.getWordCount() / 200)
  }

  equals(other: Approach): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value || ''
  }
}
