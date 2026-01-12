import { describe, expect, test } from 'bun:test'
import { TopoImageUrl } from '../topo-image-url.vo'

describe('TopoImageUrl Value Object', () => {
  // TEST CASES LIST (REASON)
  // Order: simple → complex
  //
  // 1. ✓ Create TopoImageUrl from valid https URL
  // 2. ✓ Create TopoImageUrl from valid http URL
  // 3. ✓ Get URL value as string
  // 4. ✓ Reject empty string
  // 5. ✓ Reject invalid URL (no protocol)
  // 6. ✓ Trim whitespace from valid URL
  // 7. ✓ Two TopoImageUrls with same value are equal
  // 8. ✓ Two TopoImageUrls with different values are not equal
  // 9. ✓ Check if URL is for thumbnail (contains size indicator)
  // 10. ✓ Create empty URL (for cases where URL is not available)

  test('should create TopoImageUrl from valid https URL', () => {
    // Act
    const url = TopoImageUrl.create('https://example.com/image.jpg')

    // Assert
    expect(url).toBeInstanceOf(TopoImageUrl)
  })

  test('should create TopoImageUrl from valid http URL', () => {
    // Act
    const url = TopoImageUrl.create('http://example.com/image.jpg')

    // Assert
    expect(url).toBeInstanceOf(TopoImageUrl)
  })

  test('should get URL value as string', () => {
    // Arrange
    const url = TopoImageUrl.create('https://example.com/image.jpg')

    // Act & Assert
    expect(url.getValue()).toBe('https://example.com/image.jpg')
  })

  test('should reject empty string', () => {
    // Act & Assert
    expect(() => TopoImageUrl.create('')).toThrow()
  })

  test('should reject invalid URL without protocol', () => {
    // Act & Assert
    expect(() => TopoImageUrl.create('example.com/image.jpg')).toThrow()
  })

  test('should trim whitespace from valid URL', () => {
    // Act
    const url = TopoImageUrl.create('  https://example.com/image.jpg  ')

    // Assert
    expect(url.getValue()).toBe('https://example.com/image.jpg')
  })

  test('should equal another TopoImageUrl with same value', () => {
    // Arrange
    const url1 = TopoImageUrl.create('https://example.com/image.jpg')
    const url2 = TopoImageUrl.create('https://example.com/image.jpg')

    // Act & Assert
    expect(url1.equals(url2)).toBe(true)
  })

  test('should not equal another TopoImageUrl with different value', () => {
    // Arrange
    const url1 = TopoImageUrl.create('https://example.com/image1.jpg')
    const url2 = TopoImageUrl.create('https://example.com/image2.jpg')

    // Act & Assert
    expect(url1.equals(url2)).toBe(false)
  })

  test('should identify thumbnail URL by size indicator', () => {
    // Arrange
    const thumbnailUrl = TopoImageUrl.create(
      'https://example.com/image-100x100.jpg',
    )
    const fullUrl = TopoImageUrl.create('https://example.com/image.jpg')

    // Act & Assert
    expect(thumbnailUrl.isThumbnail()).toBe(true)
    expect(fullUrl.isThumbnail()).toBe(false)
  })

  test('should create empty URL for cases where URL is not available', () => {
    // Act
    const emptyUrl = TopoImageUrl.empty()

    // Assert
    expect(emptyUrl.isEmpty()).toBe(true)
    expect(emptyUrl.getValue()).toBe('')
  })

  test('toString should return the URL value', () => {
    // Arrange
    const url = TopoImageUrl.create('https://example.com/image.jpg')

    // Act & Assert
    expect(url.toString()).toBe('https://example.com/image.jpg')
  })

  describe('createFrom (trusted input)', () => {
    test('should create TopoImageUrl from trusted input', () => {
      // Act
      const url = TopoImageUrl.createFrom('https://example.com/image.jpg')

      // Assert
      expect(url.getValue()).toBe('https://example.com/image.jpg')
    })

    test('should return empty URL for empty trusted input', () => {
      // Act
      const url = TopoImageUrl.createFrom('')

      // Assert
      expect(url.isEmpty()).toBe(true)
    })
  })
})
