export class IsOverview {
  private readonly value: boolean

  private constructor(value: boolean) {
    this.value = value
  }

  static createFrom(isOverview: boolean | null | undefined): IsOverview {
    return new IsOverview(isOverview ?? false)
  }

  static overview(): IsOverview {
    return new IsOverview(true)
  }

  static detail(): IsOverview {
    return new IsOverview(false)
  }

  getValue(): boolean {
    return this.value
  }

  isOverview(): boolean {
    return this.value
  }

  isDetail(): boolean {
    return !this.value
  }

  equals(other: IsOverview): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value ? 'Overview topo' : 'Detail topo'
  }
}
