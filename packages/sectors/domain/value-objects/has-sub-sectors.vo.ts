export class HasSubSectors {
  private readonly value: boolean

  private constructor(value: boolean) {
    this.value = value
  }

  static createFrom(hasSubSectors: boolean | null | undefined): HasSubSectors {
    return new HasSubSectors(hasSubSectors ?? false)
  }

  static withSubSectors(): HasSubSectors {
    return new HasSubSectors(true)
  }

  static withoutSubSectors(): HasSubSectors {
    return new HasSubSectors(false)
  }

  getValue(): boolean {
    return this.value
  }

  hasSubSectors(): boolean {
    return this.value
  }

  isLeaf(): boolean {
    return !this.value
  }

  equals(other: HasSubSectors): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value ? 'Has sub-sectors' : 'Leaf sector'
  }
}
