export class HasRoutes {
  private readonly value: boolean

  private constructor(value: boolean) {
    this.value = value
  }

  static createFrom(hasRoutes: boolean | null | undefined): HasRoutes {
    return new HasRoutes(hasRoutes ?? false)
  }

  static withRoutes(): HasRoutes {
    return new HasRoutes(true)
  }

  static withoutRoutes(): HasRoutes {
    return new HasRoutes(false)
  }

  getValue(): boolean {
    return this.value
  }

  hasRoutes(): boolean {
    return this.value
  }

  equals(other: HasRoutes): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value ? 'Has route annotations' : 'No route annotations'
  }
}
