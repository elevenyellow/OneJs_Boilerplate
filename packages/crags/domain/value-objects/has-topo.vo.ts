export class HasTopo {
  private readonly value: boolean

  private constructor(value: boolean) {
    this.value = value
  }

  static createFrom(hasTopo: boolean | null | undefined): HasTopo {
    return new HasTopo(hasTopo ?? false)
  }

  static withTopo(): HasTopo {
    return new HasTopo(true)
  }

  static withoutTopo(): HasTopo {
    return new HasTopo(false)
  }

  getValue(): boolean {
    return this.value
  }

  hasTopo(): boolean {
    return this.value
  }

  equals(other: HasTopo): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value ? 'Has topo' : 'No topo'
  }
}
