/**
 * Value Object representing a raw API response from TheCrag's getNodeInfo endpoint.
 * Stores the complete JSON response for debugging and data recovery purposes,
 * while providing convenience methods for accessing common fields.
 */
export class RawNodeResponse {
  private constructor(
    private readonly rawJson: Record<string, unknown>,
    private readonly rawJsonString: string,
    private readonly timestamp: number,
  ) {}

  /**
   * Creates a RawNodeResponse from an API response object.
   */
  static fromApiResponse(response: Record<string, unknown>): RawNodeResponse {
    const jsonString = JSON.stringify(response)
    return new RawNodeResponse({ ...response }, jsonString, Date.now())
  }

  /**
   * Creates a RawNodeResponse from a JSON string.
   */
  static fromJsonString(jsonString: string): RawNodeResponse {
    const parsed = JSON.parse(jsonString) as Record<string, unknown>
    return new RawNodeResponse(parsed, jsonString, Date.now())
  }

  /**
   * Returns the raw JSON object.
   * Note: Returns a copy to maintain immutability.
   */
  getRawJson(): Record<string, unknown> {
    return { ...this.rawJson }
  }

  /**
   * Returns the raw JSON as a string.
   */
  getRawJsonString(): string {
    return this.rawJsonString
  }

  /**
   * Returns the timestamp when this response was captured.
   */
  getTimestamp(): number {
    return this.timestamp
  }

  /**
   * Returns the node ID from the response.
   */
  getNodeId(): number | null {
    const id = this.rawJson.id ?? this.rawJson.nid
    return typeof id === 'number' ? id : null
  }

  /**
   * Returns the node name from the response.
   */
  getNodeName(): string | null {
    const name = this.rawJson.name
    return typeof name === 'string' ? name : null
  }

  /**
   * Returns true if the response has the specified field.
   */
  hasField(fieldName: string): boolean {
    return fieldName in this.rawJson
  }

  /**
   * Returns the value of a specific field.
   */
  getField<T = unknown>(fieldName: string): T | undefined {
    return this.rawJson[fieldName] as T | undefined
  }

  /**
   * Returns the value of a specific field, or a default value if not present.
   */
  getFieldWithDefault<T>(fieldName: string, defaultValue: T): T {
    if (fieldName in this.rawJson) {
      return this.rawJson[fieldName] as T
    }
    return defaultValue
  }

  /**
   * Returns the raw JSON size in bytes (approximately).
   */
  getSize(): number {
    return this.rawJsonString.length
  }

  equals(other: RawNodeResponse): boolean {
    return this.rawJsonString === other.rawJsonString
  }

  toString(): string {
    const id = this.getNodeId()
    const name = this.getNodeName()
    return `RawNodeResponse(id: ${id}, name: ${name})`
  }
}
