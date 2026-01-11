import { v4 as uuidv4 } from 'uuid'

export class TopoImageId {
  private constructor(private readonly value: string) {}

  static generate(): TopoImageId {
    return new TopoImageId(uuidv4())
  }

  static fromString(id: string): TopoImageId {
    return new TopoImageId(id)
  }

  toString(): string {
    return this.value
  }

  equals(other: TopoImageId): boolean {
    return this.value === other.value
  }
}
