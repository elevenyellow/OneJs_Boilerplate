/**
 * PermitInfo Value Object
 * Represents permit/access information for a climbing area
 */
export class PermitInfo {
  private constructor(
    private readonly data: Record<string, unknown> | null,
  ) {}

  static create(permitNode: unknown): PermitInfo {
    if (!permitNode) {
      return new PermitInfo(null)
    }

    if (typeof permitNode === 'object' && permitNode !== null) {
      return new PermitInfo(permitNode as Record<string, unknown>)
    }

    return new PermitInfo(null)
  }

  static empty(): PermitInfo {
    return new PermitInfo(null)
  }

  toJSON(): Record<string, unknown> | null {
    return this.data
  }

  hasPermitRequired(): boolean {
    if (!this.data) return false
    
    // Check common fields that might indicate permit requirement
    return Boolean(
      this.data.required ||
      this.data.permitRequired ||
      this.data.accessRestricted
    )
  }

  isEmpty(): boolean {
    return this.data === null
  }

  equals(other: PermitInfo): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data)
  }

  getDescription(): string | null {
    if (!this.data) return null
    
    // Try to extract description
    if (typeof this.data.description === 'string') {
      return this.data.description
    }
    
    if (typeof this.data.note === 'string') {
      return this.data.note
    }

    return null
  }
}
