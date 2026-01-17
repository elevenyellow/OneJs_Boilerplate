/**
 * Base abstract class for URL stub identifiers.
 * URL stubs represent the path components used in TheCrag URLs.
 * Each bounded context should extend this class for its own UrlStub value object.
 *
 * @example
 * ```typescript
 * // packages/routes/domain/value-objects/url-stub.vo.ts
 * import { BaseUrlStub } from '@shared/domain/value-objects'
 *
 * export class UrlStub extends BaseUrlStub<UrlStub> {
 *   protected createInstance(urlStub: string | null, urlAncestorStub: string | null): UrlStub {
 *     return new UrlStub(urlStub, urlAncestorStub)
 *   }
 * }
 * ```
 */
export abstract class BaseUrlStub<T extends BaseUrlStub<T>> {
  protected readonly urlStub: string | null
  protected readonly urlAncestorStub: string | null

  protected constructor(
    urlStub: string | null,
    urlAncestorStub: string | null,
  ) {
    this.urlStub = urlStub
    this.urlAncestorStub = urlAncestorStub
  }

  /**
   * Create a new instance with the given values.
   * Subclasses must implement this to return their own type.
   */
  protected abstract createInstance(
    urlStub: string | null,
    urlAncestorStub: string | null,
  ): T

  /**
   * Gets the URL stub component.
   */
  getUrlStub(): string | null {
    return this.urlStub
  }

  /**
   * Gets the ancestor URL stub component.
   */
  getUrlAncestorStub(): string | null {
    return this.urlAncestorStub
  }

  /**
   * Gets the full path by combining ancestor and stub.
   */
  getFullPath(): string | null {
    if (this.urlStub && this.urlAncestorStub) {
      return `${this.urlAncestorStub}/${this.urlStub}`
    }
    return this.urlStub || this.urlAncestorStub || null
  }

  /**
   * Gets the complete TheCrag URL.
   */
  getTheCragUrl(): string | null {
    const path = this.getFullPath()
    return path ? `https://www.thecrag.com/climbing/${path}` : null
  }

  /**
   * Checks if this URL stub equals another.
   */
  equals(other: T): boolean {
    return (
      this.urlStub === other.urlStub &&
      this.urlAncestorStub === other.urlAncestorStub
    )
  }

  /**
   * Returns the full path as string.
   */
  toString(): string {
    return this.getFullPath() || ''
  }

  /**
   * Checks if this URL stub has any data.
   */
  hasData(): boolean {
    return this.urlStub !== null || this.urlAncestorStub !== null
  }
}
