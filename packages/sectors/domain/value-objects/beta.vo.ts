import type { BetaItemData } from '../dtos/sector-create.dto'

export class Beta {
  private readonly items: BetaItemData[]

  private constructor(items: BetaItemData[]) {
    this.items = items
  }

  static createFrom(items: BetaItemData[] | null | undefined): Beta {
    return new Beta(items ?? [])
  }

  static createEmpty(): Beta {
    return new Beta([])
  }

  getItems(): BetaItemData[] {
    return this.items
  }

  getSummary(): string | null {
    const uniqueFeatures = this.items.find(
      (item) =>
        item.name === 'Unique Features And Strengths' ||
        item.name === 'Summary',
    )
    return uniqueFeatures?.markdown || null
  }

  getApproach(): string | null {
    const approach = this.items.find((item) => item.name === 'Approach')
    return approach?.markdown || null
  }

  getWhereToStay(): string | null {
    const whereToStay = this.items.find((item) => item.name === 'Where To Stay')
    return whereToStay?.markdown || null
  }

  getEthic(): string | null {
    const ethic = this.items.find((item) => item.name === 'Ethic')
    return ethic?.markdown || null
  }

  getHistory(): string | null {
    const history = this.items.find((item) => item.name === 'History')
    return history?.markdown || null
  }

  getByName(name: string): string | null {
    const item = this.items.find((item) => item.name === name)
    return item?.markdown || null
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  toJSON(): BetaItemData[] | null {
    return this.items.length > 0 ? this.items : null
  }

  equals(other: Beta): boolean {
    return JSON.stringify(this.items) === JSON.stringify(other.items)
  }

  toString(): string {
    return `Beta items: ${this.items.map((i) => i.name).join(', ')}`
  }
}
