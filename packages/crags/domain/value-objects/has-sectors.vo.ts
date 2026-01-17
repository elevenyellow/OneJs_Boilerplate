export class HasSectors {
  private readonly value: boolean

  private constructor(value: boolean) {
    this.value = value
  }

  static createFrom(hasSectors: boolean | null | undefined): HasSectors {
    return new HasSectors(hasSectors ?? false)
  }

  static withSectors(): HasSectors {
    return new HasSectors(true)
  }

  static withoutSectors(): HasSectors {
    return new HasSectors(false)
  }

  getValue(): boolean {
    return this.value
  }

  hasSectors(): boolean {
    return this.value
  }

  isFlat(): boolean {
    return !this.value
  }

  equals(other: HasSectors): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value ? 'Has sectors' : 'Flat crag'
  }
}
