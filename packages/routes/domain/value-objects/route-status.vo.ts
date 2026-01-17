export class RouteStatus {
  private readonly isClosed: boolean
  private readonly hasWarning: boolean
  private readonly warningText: string | null

  private constructor(
    isClosed: boolean,
    hasWarning: boolean,
    warningText: string | null,
  ) {
    this.isClosed = isClosed
    this.hasWarning = hasWarning
    this.warningText = warningText
  }

  static createFrom(
    isClosed: boolean | null | undefined,
    hasWarning: boolean | null | undefined,
    warningText: string | null | undefined,
  ): RouteStatus {
    return new RouteStatus(
      isClosed ?? false,
      hasWarning ?? false,
      warningText?.trim() || null,
    )
  }

  static createEmpty(): RouteStatus {
    return new RouteStatus(false, false, null)
  }

  getIsClosed(): boolean {
    return this.isClosed
  }

  getHasWarning(): boolean {
    return this.hasWarning
  }

  getWarningText(): string | null {
    return this.warningText
  }

  isClimbable(): boolean {
    return !this.isClosed
  }

  hasIssues(): boolean {
    return this.isClosed || this.hasWarning
  }

  getStatusLabel(): string {
    if (this.isClosed) return 'Closed'
    if (this.hasWarning) return 'Warning'
    return 'Open'
  }

  equals(other: RouteStatus): boolean {
    return (
      this.isClosed === other.isClosed &&
      this.hasWarning === other.hasWarning &&
      this.warningText === other.warningText
    )
  }

  toString(): string {
    return this.getStatusLabel()
  }
}
