export class TopoReference {
  private readonly hasTopo: boolean
  private readonly topoNumber: string | null

  private constructor(hasTopo: boolean, topoNumber: string | null) {
    this.hasTopo = hasTopo
    this.topoNumber = topoNumber
  }

  static createFrom(
    hasTopo: boolean | null | undefined,
    topoNumber: string | null | undefined,
  ): TopoReference {
    return new TopoReference(hasTopo ?? false, topoNumber?.trim() || null)
  }

  static createEmpty(): TopoReference {
    return new TopoReference(false, null)
  }

  getHasTopo(): boolean {
    return this.hasTopo
  }

  getTopoNumber(): string | null {
    return this.topoNumber
  }

  hasValue(): boolean {
    return this.hasTopo
  }

  equals(other: TopoReference): boolean {
    return this.hasTopo === other.hasTopo && this.topoNumber === other.topoNumber
  }

  toString(): string {
    if (!this.hasTopo) return ''
    return this.topoNumber || 'Has topo'
  }
}
