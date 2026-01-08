import { ExternalId, Geometry } from '@climb-zone/shared'

export class ContinentId {
  private constructor(private readonly value: string) {}

  static generate(): ContinentId {
    return new ContinentId(crypto.randomUUID())
  }

  static fromString(id: string): ContinentId {
    return new ContinentId(id)
  }

  toString(): string {
    return this.value
  }

  equals(other: ContinentId): boolean {
    return this.value === other.value
  }
}

export class ContinentEntity {
  constructor(
    public readonly id: ContinentId,
    public readonly externalId: ExternalId,
    public readonly name: string,
    public readonly geometry: Geometry | null,
  ) {}

  static create(
    externalId: ExternalId,
    name: string,
    geometry: Geometry | null,
  ): ContinentEntity {
    return new ContinentEntity(
      ContinentId.generate(),
      externalId,
      name,
      geometry,
    )
  }
}
