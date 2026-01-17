export class AkaNames {
  private readonly names: string[]

  private constructor(names: string[]) {
    this.names = names
  }

  static createFrom(names: string[] | null | undefined): AkaNames {
    if (!names) return AkaNames.createEmpty()
    return new AkaNames(names.filter((n) => n && n.trim() !== '').map((n) => n.trim()))
  }

  static createEmpty(): AkaNames {
    return new AkaNames([])
  }

  getNames(): string[] {
    return [...this.names]
  }

  hasData(): boolean {
    return this.names.length > 0
  }

  hasName(name: string): boolean {
    return this.names.some((n) => n.toLowerCase() === name.toLowerCase())
  }

  equals(other: AkaNames): boolean {
    return JSON.stringify(this.names.sort()) === JSON.stringify(other.names.sort())
  }

  toString(): string {
    return this.names.join(', ')
  }
}
