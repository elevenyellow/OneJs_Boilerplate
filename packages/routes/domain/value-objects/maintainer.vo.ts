export class Maintainer {
  private readonly name: string | null
  private readonly date: string | null

  private constructor(name: string | null, date: string | null) {
    this.name = name
    this.date = date
  }

  static createFrom(
    maintainer: string | null | undefined,
    maintDate: string | null | undefined,
  ): Maintainer {
    return new Maintainer(maintainer?.trim() || null, maintDate?.trim() || null)
  }

  static createEmpty(): Maintainer {
    return new Maintainer(null, null)
  }

  getName(): string | null {
    return this.name
  }

  getDate(): string | null {
    return this.date
  }

  hasValue(): boolean {
    return this.name !== null
  }

  getDisplayValue(): string {
    if (!this.name) return ''
    if (this.date) return `${this.name} (${this.date})`
    return this.name
  }

  equals(other: Maintainer): boolean {
    return this.name === other.name && this.date === other.date
  }

  toString(): string {
    return this.getDisplayValue()
  }
}
