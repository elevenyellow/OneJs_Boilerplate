import { BaseUrlStub } from '@shared/domain/value-objects'

/**
 * Route-specific URL stub for TheCrag URLs.
 * Extends BaseUrlStub to inherit common URL functionality.
 */
export class UrlStub extends BaseUrlStub<UrlStub> {
  private constructor(urlStub: string | null, urlAncestorStub: string | null) {
    super(urlStub, urlAncestorStub)
  }

  protected createInstance(
    urlStub: string | null,
    urlAncestorStub: string | null,
  ): UrlStub {
    return new UrlStub(urlStub, urlAncestorStub)
  }

  static createFrom(
    urlStub: string | null | undefined,
    urlAncestorStub: string | null | undefined,
  ): UrlStub {
    return new UrlStub(urlStub || null, urlAncestorStub || null)
  }

  static createEmpty(): UrlStub {
    return new UrlStub(null, null)
  }
}
