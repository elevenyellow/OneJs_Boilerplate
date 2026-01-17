// Tipos de zona según la jerarquía de theCrag
export type ZoneTypeValue =
  | 'world'
  | 'continent'
  | 'country'
  | 'region'
  | 'province'
  | 'area'
  | 'crag-group'
  | 'unknown'

export class ZoneType {
  private constructor(private readonly value: ZoneTypeValue) {}

  static create(value: string): ZoneType {
    const normalized = value?.toLowerCase() || 'unknown'

    // Mapear tipos comunes de theCrag
    const typeMap: Record<string, ZoneTypeValue> = {
      world: 'world',
      continent: 'continent',
      country: 'country',
      region: 'region',
      province: 'province',
      state: 'province',
      area: 'area',
      'crag-group': 'crag-group',
      'crag group': 'crag-group',
    }

    return new ZoneType(typeMap[normalized] || 'unknown')
  }

  toString(): string {
    return this.value
  }

  equals(other: ZoneType): boolean {
    return this.value === other.value
  }

  isCountry(): boolean {
    return this.value === 'country'
  }

  isRegion(): boolean {
    return this.value === 'region'
  }

  isProvince(): boolean {
    return this.value === 'province'
  }
}
