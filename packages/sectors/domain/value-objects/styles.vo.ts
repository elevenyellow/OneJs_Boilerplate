import type { StyleInfoData } from '../dtos'

export class Styles {
  private readonly items: StyleInfoData[]

  private constructor(items: StyleInfoData[]) {
    this.items = items
  }

  static createFrom(items: StyleInfoData[] | null | undefined): Styles {
    return new Styles(items ?? [])
  }

  static createEmpty(): Styles {
    return new Styles([])
  }

  getItems(): StyleInfoData[] {
    return this.items
  }

  getPrimaryStyle(): string | null {
    if (this.items.length === 0) return null
    return this.items[0].label
  }

  getTotalRoutes(): number {
    return this.items.reduce((sum, style) => sum + style.total, 0)
  }

  getStyleByLabel(label: string): StyleInfoData | null {
    return this.items.find((style) => style.label === label) || null
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  toJSON(): StyleInfoData[] | null {
    return this.items.length > 0 ? this.items : null
  }

  equals(other: Styles): boolean {
    return JSON.stringify(this.items) === JSON.stringify(other.items)
  }

  toString(): string {
    return this.items.map((s) => `${s.label} (${s.total})`).join(', ')
  }
}
