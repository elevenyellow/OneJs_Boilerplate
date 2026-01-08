import { ContinentId } from '@climb-zone/continent'
import { ExternalId, Geometry } from '@climb-zone/shared'

export class CountryId {
  private constructor(private readonly value: string) {}

  static generate(): CountryId {
    return new CountryId(crypto.randomUUID())
  }

  static fromString(id: string): CountryId {
    return new CountryId(id)
  }

  toString(): string {
    return this.value
  }

  equals(other: CountryId): boolean {
    return this.value === other.value
  }
}

export class CountryEntity {
  constructor(
    public readonly id: CountryId,
    public readonly externalId: ExternalId,
    public readonly continentId: ContinentId,
    public readonly name: string,
    public readonly geometry: Geometry | null,
  ) {}

  static create(
    externalId: ExternalId,
    continentId: ContinentId,
    name: string,
    geometry: Geometry | null,
  ): CountryEntity {
    return new CountryEntity(
      CountryId.generate(),
      externalId,
      continentId,
      name,
      geometry,
    )
  }
}
