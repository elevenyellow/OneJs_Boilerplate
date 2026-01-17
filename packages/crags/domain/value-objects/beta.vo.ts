export interface BetaItem {
  markdown: string
  name: string
  inheritedFrom?: {
    id: string
    urlAncestorStub: string
  }
}

export class Beta {
  private readonly items: BetaItem[]

  private constructor(items: BetaItem[]) {
    this.items = items
  }

  static createFrom(items: BetaItem[] | null | undefined): Beta {
    return new Beta(items || [])
  }

  static createEmpty(): Beta {
    return new Beta([])
  }

  getItems(): BetaItem[] {
    return [...this.items]
  }

  hasData(): boolean {
    return this.items.length > 0
  }

  getByName(name: string): BetaItem | null {
    return (
      this.items.find(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      ) || null
    )
  }

  getApproach(): string | null {
    const approach = this.getByName('Approach')
    return approach?.markdown || null
  }

  getDescription(): string | null {
    const description = this.getByName('Description')
    return description?.markdown || null
  }

  getAccess(): string | null {
    const access = this.getByName('Access')
    return access?.markdown || null
  }

  getEthics(): string | null {
    const ethics = this.getByName('Ethics')
    return ethics?.markdown || null
  }

  getAllMarkdown(): string {
    return this.items
      .map((item) => `## ${item.name}\n${item.markdown}`)
      .join('\n\n')
  }

  toJSON(): BetaItem[] {
    return [...this.items]
  }

  equals(other: Beta): boolean {
    return JSON.stringify(this.items) === JSON.stringify(other.items)
  }

  toString(): string {
    return `Beta: ${this.items.length} items`
  }
}
