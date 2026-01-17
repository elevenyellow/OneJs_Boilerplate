export class Pitches {
  private readonly value: number | null

  private constructor(value: number | null) {
    this.value = value
  }

  static createFrom(pitches: number | null | undefined): Pitches {
    return new Pitches(pitches ?? null)
  }

  static createEmpty(): Pitches {
    return new Pitches(null)
  }

  getValue(): number | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  isSinglePitch(): boolean {
    return this.value === 1 || this.value === null
  }

  isMultiPitch(): boolean {
    return this.value !== null && this.value > 1
  }

  equals(other: Pitches): boolean {
    return this.value === other.value
  }

  toString(): string {
    if (this.value === null) return ''
    return `${this.value} pitch${this.value > 1 ? 'es' : ''}`
  }
}
