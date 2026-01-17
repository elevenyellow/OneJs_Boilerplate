export class SectorType {
  private readonly type: string
  private readonly subType: string

  private constructor(type: string, subType: string) {
    this.type = type
    this.subType = subType
  }

  static createFrom(type: string, subType: string): SectorType {
    return new SectorType(type || 'area', subType || 'sector')
  }

  getType(): string {
    return this.type
  }

  getSubType(): string {
    return this.subType
  }

  isSector(): boolean {
    return this.subType === 'sector'
  }

  isSubSector(): boolean {
    return this.subType === 'subsector'
  }

  isArea(): boolean {
    return this.type === 'area'
  }

  equals(other: SectorType): boolean {
    return this.type === other.type && this.subType === other.subType
  }

  toString(): string {
    return `${this.type}:${this.subType}`
  }
}
