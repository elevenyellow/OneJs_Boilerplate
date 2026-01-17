export class SiblingLabel {
  private readonly value: number | null

  private constructor(value: number | null) {
    this.value = value
  }

  static createFrom(label: number | null | undefined): SiblingLabel {
    return new SiblingLabel(label ?? null)
  }

  static createEmpty(): SiblingLabel {
    return new SiblingLabel(null)
  }

  getValue(): number | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  equals(other: SiblingLabel): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value?.toString() || ''
  }
}
