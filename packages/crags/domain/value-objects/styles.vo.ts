export interface StyleInfo {
  gradeBand: number[]
  label: string
  style: string
  total: number
  translate_stub: string
}

export class Styles {
  private readonly items: StyleInfo[]

  private constructor(items: StyleInfo[]) {
    this.items = items
  }

  static createFrom(items: StyleInfo[] | null | undefined): Styles {
    return new Styles(items || [])
  }

  static createEmpty(): Styles {
    return new Styles([])
  }

  getItems(): StyleInfo[] {
    return [...this.items]
  }

  hasData(): boolean {
    return this.items.length > 0
  }

  getByStyle(style: string): StyleInfo | null {
    return (
      this.items.find(
        (item) => item.style.toLowerCase() === style.toLowerCase(),
      ) || null
    )
  }

  getSportCount(): number {
    return this.getByStyle('sport')?.total ?? 0
  }

  getTradCount(): number {
    return this.getByStyle('trad')?.total ?? 0
  }

  getBoulderCount(): number {
    return this.getByStyle('boulder')?.total ?? 0
  }

  getDominantStyle(): string | null {
    if (this.items.length === 0) return null
    const sorted = [...this.items].sort((a, b) => b.total - a.total)
    return sorted[0].style
  }

  getTotalRoutes(): number {
    return this.items.reduce((sum, item) => sum + item.total, 0)
  }

  getStylePercentage(style: string): number {
    const total = this.getTotalRoutes()
    if (total === 0) return 0
    const styleInfo = this.getByStyle(style)
    return styleInfo ? (styleInfo.total / total) * 100 : 0
  }

  toJSON(): StyleInfo[] {
    return [...this.items]
  }

  equals(other: Styles): boolean {
    return JSON.stringify(this.items) === JSON.stringify(other.items)
  }

  toString(): string {
    return this.items.map((s) => `${s.style}: ${s.total}`).join(', ')
  }
}
