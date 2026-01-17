export type WarningsData = Record<string, unknown>

export class Warnings {
  private readonly data: WarningsData | null

  private constructor(data: WarningsData | null) {
    this.data = data
  }

  static createFrom(data: WarningsData | null | undefined): Warnings {
    return new Warnings(data || null)
  }

  static createEmpty(): Warnings {
    return new Warnings(null)
  }

  getData(): WarningsData | null {
    return this.data ? { ...this.data } : null
  }

  hasData(): boolean {
    return this.data !== null && Object.keys(this.data).length > 0
  }

  toJSON(): WarningsData | null {
    return this.data
  }

  equals(other: Warnings): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data)
  }

  toString(): string {
    return JSON.stringify(this.data)
  }
}
