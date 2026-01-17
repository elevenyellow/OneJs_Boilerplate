export interface TagItem {
  id: number
  name: string
  hasIcon?: number
}

export type TagsMap = Record<string, Record<string, TagItem>>

export class Tags {
  private readonly data: TagsMap

  private constructor(data: TagsMap) {
    this.data = data
  }

  static createFrom(data: TagsMap | null | undefined): Tags {
    return new Tags(data || {})
  }

  static createEmpty(): Tags {
    return new Tags({})
  }

  getData(): TagsMap {
    return { ...this.data }
  }

  hasData(): boolean {
    return Object.keys(this.data).length > 0
  }

  getCategories(): string[] {
    return Object.keys(this.data)
  }

  getTagsByCategory(category: string): TagItem[] {
    const categoryData = this.data[category]
    if (!categoryData) return []
    return Object.values(categoryData)
  }

  getAllTags(): TagItem[] {
    const allTags: TagItem[] = []
    for (const category of Object.values(this.data)) {
      allTags.push(...Object.values(category))
    }
    return allTags
  }

  hasTag(tagName: string): boolean {
    for (const category of Object.values(this.data)) {
      for (const tag of Object.values(category)) {
        if (tag.name.toLowerCase() === tagName.toLowerCase()) {
          return true
        }
      }
    }
    return false
  }

  toJSON(): TagsMap {
    return { ...this.data }
  }

  equals(other: Tags): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data)
  }

  toString(): string {
    const tags = this.getAllTags()
    return tags.map((t) => t.name).join(', ')
  }
}
