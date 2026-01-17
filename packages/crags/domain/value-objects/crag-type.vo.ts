export class CragType {
  private readonly type: string
  private readonly subType: string

  private constructor(type: string, subType: string) {
    this.type = type
    this.subType = subType
  }

  static createFrom(type: string, subType: string): CragType {
    return new CragType(type || 'area', subType || 'crag')
  }

  getType(): string {
    return this.type
  }

  getSubType(): string {
    return this.subType
  }

  isCrag(): boolean {
    return this.subType === 'crag'
  }

  isRegion(): boolean {
    return this.subType === 'region'
  }

  isArea(): boolean {
    return this.type === 'area'
  }

  equals(other: CragType): boolean {
    return this.type === other.type && this.subType === other.subType
  }

  toString(): string {
    return `${this.type}:${this.subType}`
  }
}
