export class Stars {
  private readonly value: number | null

  private constructor(value: number | null) {
    this.value = value
  }

  static createFrom(stars: number | null | undefined): Stars {
    if (stars !== null && stars !== undefined) {
      // Clamp entre 0 y 3
      const clamped = Math.max(0, Math.min(3, stars))
      return new Stars(clamped)
    }
    return new Stars(null)
  }

  static createEmpty(): Stars {
    return new Stars(null)
  }

  getValue(): number | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  isClassic(): boolean {
    return this.value !== null && this.value >= 3
  }

  isRecommended(): boolean {
    return this.value !== null && this.value >= 2
  }

  getDisplayStars(): string {
    if (this.value === null) return ''
    return '★'.repeat(this.value) + '☆'.repeat(3 - this.value)
  }

  equals(other: Stars): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.getDisplayStars()
  }
}
