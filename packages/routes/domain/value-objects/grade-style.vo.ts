export class GradeStyle {
  private readonly value: string | null

  private constructor(value: string | null) {
    this.value = value
  }

  static createFrom(style: string | null | undefined): GradeStyle {
    return new GradeStyle(style || null)
  }

  static createEmpty(): GradeStyle {
    return new GradeStyle(null)
  }

  getValue(): string | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  isSport(): boolean {
    return this.value?.toLowerCase() === 'sport'
  }

  isTrad(): boolean {
    return this.value?.toLowerCase() === 'trad'
  }

  isBoulder(): boolean {
    return this.value?.toLowerCase() === 'boulder'
  }

  equals(other: GradeStyle): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value || ''
  }
}
