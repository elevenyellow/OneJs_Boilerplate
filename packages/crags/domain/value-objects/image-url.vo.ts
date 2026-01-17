export class ImageUrl {
  private readonly value: string | null

  private constructor(value: string | null) {
    this.value = value
  }

  static createFrom(url: string | null | undefined): ImageUrl {
    if (!url || url.trim() === '') {
      return ImageUrl.createEmpty()
    }
    return new ImageUrl(url.trim())
  }

  static createEmpty(): ImageUrl {
    return new ImageUrl(null)
  }

  getValue(): string | null {
    return this.value
  }

  hasValue(): boolean {
    return this.value !== null
  }

  isTheCragImage(): boolean {
    return this.value?.includes('image.thecrag.com') ?? false
  }

  getThumbnail(width: number = 200): string | null {
    if (!this.value) return null
    if (this.isTheCragImage()) {
      return this.value.replace(/\/\d+x\d+\//, `/${width}x0/`)
    }
    return this.value
  }

  getFullSize(): string | null {
    if (!this.value) return null
    if (this.isTheCragImage()) {
      return this.value.replace(/\/\d+x\d+\//, '/0x0/')
    }
    return this.value
  }

  equals(other: ImageUrl): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value || ''
  }
}
