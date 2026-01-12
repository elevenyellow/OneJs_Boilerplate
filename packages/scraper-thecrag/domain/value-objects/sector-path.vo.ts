import type { NodeId } from './node-id.vo'

/**
 * Value Object representing a sector/area path on TheCrag.
 * Encapsulates the logic for building URL paths from urlStub and urlAncestorStub.
 */
export class SectorPath {
  private static readonly BASE_URL = 'https://www.thecrag.com'
  private static readonly PATH_PREFIX = '/en/climbing'

  private constructor(private readonly value: string) {}

  /**
   * Builds a SectorPath from urlStub, urlAncestorStub, or nodeId.
   * Priority: urlStub > urlAncestorStub + area/{nodeId} > area/{nodeId}
   */
  static build(
    nodeId: NodeId,
    urlStub: string | undefined,
    urlAncestorStub: string | undefined,
  ): SectorPath {
    if (urlStub) {
      const ancestorPart = urlAncestorStub ? `${urlAncestorStub}/` : ''
      const stubPart = urlStub.startsWith('/') ? urlStub.slice(1) : urlStub
      return new SectorPath(
        `${SectorPath.PATH_PREFIX}/${ancestorPart}${stubPart}`,
      )
    }

    if (urlAncestorStub) {
      return new SectorPath(
        `${SectorPath.PATH_PREFIX}/${urlAncestorStub}/area/${nodeId.toString()}`,
      )
    }

    return new SectorPath(`${SectorPath.PATH_PREFIX}/area/${nodeId.toString()}`)
  }

  /**
   * Creates a SectorPath from a known path value.
   */
  static createFrom(path: string): SectorPath {
    return new SectorPath(path)
  }

  getValue(): string {
    return this.value
  }

  /**
   * Returns the full URL including the base domain.
   */
  getFullUrl(): string {
    return `${SectorPath.BASE_URL}${this.value}`
  }

  equals(other: SectorPath): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
