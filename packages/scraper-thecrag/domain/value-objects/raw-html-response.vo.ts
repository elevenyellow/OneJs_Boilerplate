/**
 * Value Object representing a raw HTML response from a TheCrag page.
 * Stores the complete HTML for debugging and data recovery purposes,
 * while providing convenience methods for checking content availability.
 */
export class RawHtmlResponse {
  private constructor(
    private readonly html: string,
    private readonly url: string,
    private readonly timestamp: number,
  ) {}

  /**
   * Creates a RawHtmlResponse from an HTML string and URL.
   */
  static create(html: string, url: string): RawHtmlResponse {
    return new RawHtmlResponse(html, url, Date.now())
  }

  /**
   * Returns the raw HTML string.
   */
  getRawHtml(): string {
    return this.html
  }

  /**
   * Returns the URL this HTML was fetched from.
   */
  getUrl(): string {
    return this.url
  }

  /**
   * Returns the timestamp when this response was captured.
   */
  getTimestamp(): number {
    return this.timestamp
  }

  /**
   * Returns the length of the HTML content.
   */
  getContentLength(): number {
    return this.html.length
  }

  /**
   * Returns true if the HTML contains the specified text.
   */
  contains(text: string): boolean {
    return this.html.includes(text)
  }

  /**
   * Returns true if the HTML contains topo data (data-topodata attribute).
   */
  hasTopoData(): boolean {
    return this.html.includes('data-topodata')
  }

  /**
   * Returns true if the HTML contains an og:image meta tag.
   */
  hasOgImage(): boolean {
    return this.html.includes('og:image')
  }

  /**
   * Returns true if the HTML contains route-tick data.
   */
  hasRouteTickData(): boolean {
    return this.html.includes('data-route-tick')
  }

  /**
   * Returns true if the HTML contains route history information.
   */
  hasRouteHistory(): boolean {
    return this.html.includes('route-history')
  }

  /**
   * Returns true if the HTML contains node-info sections.
   */
  hasNodeInfo(): boolean {
    return this.html.includes('node-info')
  }

  /**
   * Returns true if the HTML contains photo topo elements.
   */
  hasPhotoTopo(): boolean {
    return this.html.includes('phototopo')
  }

  /**
   * Returns true if the HTML appears to be a valid TheCrag page.
   */
  isValidTheCragPage(): boolean {
    return (
      this.html.includes('thecrag.com') ||
      this.html.includes('theCrag') ||
      this.html.includes('class="crag"')
    )
  }

  /**
   * Returns the content size in KB.
   */
  getSizeInKB(): number {
    return Math.round((this.html.length / 1024) * 10) / 10
  }

  equals(other: RawHtmlResponse): boolean {
    return this.url === other.url && this.html === other.html
  }

  toString(): string {
    return `RawHtmlResponse(url: ${this.url}, size: ${this.getSizeInKB()}KB)`
  }
}
