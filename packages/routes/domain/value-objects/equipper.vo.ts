export class Equipper {
  private readonly name: string | null
  private readonly date: string | null

  private constructor(name: string | null, date: string | null) {
    this.name = name
    this.date = date
  }

  static createFrom(
    equipper: string | null | undefined,
    equipDate: string | null | undefined,
  ): Equipper {
    return new Equipper(equipper?.trim() || null, equipDate?.trim() || null)
  }

  static createEmpty(): Equipper {
    return new Equipper(null, null)
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

  equals(other: Equipper): boolean {
    return this.name === other.name && this.date === other.date
  }

  toString(): string {
    return this.getDisplayValue()
  }
}
