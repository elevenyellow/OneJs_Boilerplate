export interface AltName {
  name: string
  type: string
}

export class AltNames {
  private readonly items: AltName[]

  private constructor(items: AltName[]) {
    this.items = items
  }

  static createFrom(items: AltName[] | null | undefined): AltNames {
    return new AltNames(items || [])
  }

  static createEmpty(): AltNames {
    return new AltNames([])
  }

  getItems(): AltName[] {
    return [...this.items]
  }

  hasData(): boolean {
    return this.items.length > 0
  }

  getNames(): string[] {
    return this.items.map((item) => item.name)
  }

  getByType(type: string): AltName[] {
    return this.items.filter(
      (item) => item.type.toLowerCase() === type.toLowerCase(),
    )
  }

  hasName(name: string): boolean {
    return this.items.some(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    )
  }

  toJSON(): AltName[] {
    return [...this.items]
  }

  equals(other: AltNames): boolean {
    return JSON.stringify(this.items) === JSON.stringify(other.items)
  }

  toString(): string {
    return this.items.map((item) => item.name).join(', ')
  }
}
