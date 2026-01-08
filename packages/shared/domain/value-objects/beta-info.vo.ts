export interface BetaItemData {
  name: string
  markdown: string
  inheritedFrom?: {
    id: string
    urlStub: string
  }
}

/**
 * Value Object representing beta information (approach, description, ethics, etc.)
 * Beta is climbing-specific information about how to climb or access a route/sector
 */
export class BetaInfo {
  constructor(public readonly items: BetaItemData[]) {}

  /**
   * Get description beta item
   */
  getDescription(): string | null {
    const item = this.items.find((i) => i.name === 'Description')
    return item?.markdown ?? null
  }

  /**
   * Get approach beta item
   */
  getApproach(): string | null {
    const item = this.items.find((i) => i.name === 'Approach')
    return item?.markdown ?? null
  }

  /**
   * Get ethics beta item
   */
  getEthic(): string | null {
    const item = this.items.find((i) => i.name === 'Ethic')
    return item?.markdown ?? null
  }

  /**
   * Get access information
   */
  getAccess(): string | null {
    const item = this.items.find((i) => i.name === 'Access')
    return item?.markdown ?? null
  }

  /**
   * Get all items as plain array
   */
  toJSON(): BetaItemData[] {
    return this.items
  }

  /**
   * Check if there's any beta information
   */
  isEmpty(): boolean {
    return this.items.length === 0
  }

  static fromJSON(data: BetaItemData[] | null | undefined): BetaInfo {
    return new BetaInfo(data ?? [])
  }

  static empty(): BetaInfo {
    return new BetaInfo([])
  }
}
