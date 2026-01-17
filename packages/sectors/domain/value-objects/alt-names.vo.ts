import type { AltNameData } from '../dtos'

export class AltNames {
  private readonly items: AltNameData[]

  private constructor(items: AltNameData[]) {
    this.items = items
  }

  static createFrom(items: AltNameData[] | null | undefined): AltNames {
    return new AltNames(items ?? [])
  }

  static createEmpty(): AltNames {
    return new AltNames([])
  }

  getItems(): AltNameData[] {
    return this.items
  }

  getNames(): string[] {
    return this.items.map((item) => item.name)
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  toJSON(): AltNameData[] | null {
    return this.items.length > 0 ? this.items : null
  }

  equals(other: AltNames): boolean {
    return JSON.stringify(this.items) === JSON.stringify(other.items)
  }

  toString(): string {
    return this.items.map((i) => i.name).join(', ')
  }
}
