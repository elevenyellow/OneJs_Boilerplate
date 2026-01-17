export type TagsData = Record<string, unknown>

export class Tags {
  private readonly data: TagsData | null

  private constructor(data: TagsData | null) {
    this.data = data
  }

  static createFrom(data: TagsData | null | undefined): Tags {
    return new Tags(data || null)
  }

  static createEmpty(): Tags {
    return new Tags(null)
  }

  getData(): TagsData | null {
    return this.data ? { ...this.data } : null
  }

  hasData(): boolean {
    return this.data !== null && Object.keys(this.data).length > 0
  }

  toJSON(): TagsData | null {
    return this.data
  }

  equals(other: Tags): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data)
  }

  toString(): string {
    return JSON.stringify(this.data)
  }
}
