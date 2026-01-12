import { GeoCoordinates } from './geo-coordinates.vo'
import { UrlStub } from './url-stub.vo'

/**
 * DTO for NodeInfo serialization.
 */
export interface NodeInfoDto {
  urlStub?: string
  urlAncestorStub?: string
  headerImageUrl?: string
  geometry?: { lat: number; long: number }
  googleMapsUrl?: string
}

/**
 * Input data for creating NodeInfo from raw API/scraper data.
 */
interface RawNodeInfoData {
  urlStub?: string | null
  urlAncestorStub?: string | null
  headerImageUrl?: string | null
  geometry?: { lat: number; long: number } | null
}

/**
 * Input data for creating NodeInfo with Value Objects.
 */
interface NodeInfoInput {
  urlStub?: UrlStub | null
  urlAncestorStub?: UrlStub | null
  headerImageUrl?: string | null
  geometry?: GeoCoordinates | null
}

/**
 * Value Object representing metadata/info for a TheCrag node.
 * Encapsulates URL stubs, header images, and geographic coordinates.
 * Supports merging with other NodeInfo instances.
 */
export class NodeInfo {
  private constructor(
    private readonly urlStub: UrlStub | null,
    private readonly urlAncestorStub: UrlStub | null,
    private readonly headerImageUrl: string | null,
    private readonly geometry: GeoCoordinates | null,
  ) {}

  /**
   * Creates a NodeInfo with Value Object inputs.
   */
  static create(input: NodeInfoInput): NodeInfo {
    return new NodeInfo(
      input.urlStub ?? null,
      input.urlAncestorStub ?? null,
      input.headerImageUrl ?? null,
      input.geometry ?? null,
    )
  }

  /**
   * Creates a NodeInfo from raw API/scraper data.
   * Converts primitive values to Value Objects.
   */
  static fromRawData(data: RawNodeInfoData): NodeInfo {
    const urlStub = data.urlStub ? UrlStub.createFrom(data.urlStub) : null
    const urlAncestorStub = data.urlAncestorStub
      ? UrlStub.createFrom(data.urlAncestorStub)
      : null
    const geometry =
      data.geometry?.lat !== undefined && data.geometry?.long !== undefined
        ? GeoCoordinates.createFrom(data.geometry.lat, data.geometry.long)
        : null

    return new NodeInfo(
      urlStub,
      urlAncestorStub,
      data.headerImageUrl ?? null,
      geometry,
    )
  }

  /**
   * Returns the URL stub for this node.
   */
  getUrlStub(): UrlStub | null {
    return this.urlStub
  }

  /**
   * Returns the ancestor URL stub (path to parent nodes).
   */
  getUrlAncestorStub(): UrlStub | null {
    return this.urlAncestorStub
  }

  /**
   * Returns the header image URL.
   */
  getHeaderImageUrl(): string | null {
    return this.headerImageUrl
  }

  /**
   * Returns the geographic coordinates.
   */
  getGeometry(): GeoCoordinates | null {
    return this.geometry
  }

  /**
   * Returns a Google Maps URL for the coordinates, or null if no geometry.
   */
  getGoogleMapsUrl(): string | null {
    if (!this.geometry) {
      return null
    }
    return this.geometry.getGoogleMapsUrl()
  }

  /**
   * Merges this NodeInfo with another, where the other's non-null values take precedence.
   * Null values in the other NodeInfo preserve this instance's values.
   */
  mergeWith(other: NodeInfo): NodeInfo {
    return new NodeInfo(
      other.urlStub ?? this.urlStub,
      other.urlAncestorStub ?? this.urlAncestorStub,
      other.headerImageUrl ?? this.headerImageUrl,
      other.geometry ?? this.geometry,
    )
  }

  /**
   * Converts to a DTO for serialization.
   * Only includes defined values (no null/undefined).
   */
  toDto(): NodeInfoDto {
    const dto: NodeInfoDto = {}

    if (this.urlStub) {
      dto.urlStub = this.urlStub.toString()
    }
    if (this.urlAncestorStub) {
      dto.urlAncestorStub = this.urlAncestorStub.toString()
    }
    if (this.headerImageUrl) {
      dto.headerImageUrl = this.headerImageUrl
    }
    if (this.geometry) {
      dto.geometry = this.geometry.toDto()
      dto.googleMapsUrl = this.geometry.getGoogleMapsUrl()
    }

    return dto
  }

  /**
   * Checks equality with another NodeInfo.
   */
  equals(other: NodeInfo): boolean {
    const urlStubEqual =
      (this.urlStub === null && other.urlStub === null) ||
      (this.urlStub !== null &&
        other.urlStub !== null &&
        this.urlStub.equals(other.urlStub))

    const urlAncestorStubEqual =
      (this.urlAncestorStub === null && other.urlAncestorStub === null) ||
      (this.urlAncestorStub !== null &&
        other.urlAncestorStub !== null &&
        this.urlAncestorStub.equals(other.urlAncestorStub))

    const headerImageUrlEqual = this.headerImageUrl === other.headerImageUrl

    const geometryEqual =
      (this.geometry === null && other.geometry === null) ||
      (this.geometry !== null &&
        other.geometry !== null &&
        this.geometry.equals(other.geometry))

    return (
      urlStubEqual &&
      urlAncestorStubEqual &&
      headerImageUrlEqual &&
      geometryEqual
    )
  }

  toString(): string {
    const parts: string[] = []
    if (this.urlStub) {
      parts.push(`urlStub: ${this.urlStub.toString()}`)
    }
    if (this.geometry) {
      parts.push(`geometry: ${this.geometry.toString()}`)
    }
    return `NodeInfo(${parts.join(', ')})`
  }
}
