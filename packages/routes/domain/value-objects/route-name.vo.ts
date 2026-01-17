export class RouteName {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static createFrom(name: string): RouteName {
    if (!name || name.trim() === '') {
      throw new Error('RouteName cannot be empty')
    }
    return new RouteName(name.trim())
  }

  getValue(): string {
    return this.value
  }

  equals(other: RouteName): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
