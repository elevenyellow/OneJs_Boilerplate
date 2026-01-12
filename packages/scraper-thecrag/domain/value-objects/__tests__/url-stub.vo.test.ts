import { describe, expect, test } from 'bun:test'
import { UrlStub } from '../url-stub.vo'

describe('UrlStub Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create UrlStub with valid value
  // 2. ✓ Get value with toString()
  // 3. ✓ Trim whitespace from value
  // 4. ✓ Create from trusted source (createFrom)
  // 5. ✓ Reject empty string
  // 6. ✓ Reject whitespace-only string
  // 7. ✓ Check equality between UrlStubs
  // 8. ✓ Build full URL from stub and ancestor

  test('should create UrlStub with valid value', () => {
    // Arrange
    const value = 'climbing-area-name'

    // Act
    const urlStub = UrlStub.create(value)

    // Assert
    expect(urlStub).toBeInstanceOf(UrlStub)
  })

  test('should get value with toString()', () => {
    // Arrange
    const value = 'climbing-area-name'
    const urlStub = UrlStub.create(value)

    // Act
    const result = urlStub.toString()

    // Assert
    expect(result).toBe('climbing-area-name')
  })

  test('should trim whitespace from value', () => {
    // Arrange
    const value = '  climbing-area-name  '

    // Act
    const urlStub = UrlStub.create(value)

    // Assert
    expect(urlStub.toString()).toBe('climbing-area-name')
  })

  test('should create from trusted source without strict validation', () => {
    // Arrange
    const value = 'trusted-value'

    // Act
    const urlStub = UrlStub.createFrom(value)

    // Assert
    expect(urlStub).toBeInstanceOf(UrlStub)
    expect(urlStub.toString()).toBe('trusted-value')
  })

  test('should reject empty string', () => {
    // Arrange
    const value = ''

    // Act & Assert
    expect(() => UrlStub.create(value)).toThrow()
  })

  test('should reject whitespace-only string', () => {
    // Arrange
    const value = '   '

    // Act & Assert
    expect(() => UrlStub.create(value)).toThrow()
  })

  test('should check equality between UrlStubs', () => {
    // Arrange
    const urlStub1 = UrlStub.create('climbing-area')
    const urlStub2 = UrlStub.create('climbing-area')
    const urlStub3 = UrlStub.create('different-area')

    // Act & Assert
    expect(urlStub1.equals(urlStub2)).toBe(true)
    expect(urlStub1.equals(urlStub3)).toBe(false)
  })

  test('should build full URL from stub and ancestor', () => {
    // Arrange
    const urlStub = UrlStub.create('sector-name')
    const ancestorStub = UrlStub.create('spain/valencia/chulilla')

    // Act
    const fullUrl = urlStub.buildFullUrl(ancestorStub)

    // Assert
    expect(fullUrl).toBe(
      'https://www.thecrag.com/climbing/spain/valencia/chulilla/sector-name',
    )
  })

  test('should build full URL without ancestor', () => {
    // Arrange
    const urlStub = UrlStub.create('spain/valencia/chulilla')

    // Act
    const fullUrl = urlStub.buildFullUrl()

    // Assert
    expect(fullUrl).toBe(
      'https://www.thecrag.com/climbing/spain/valencia/chulilla',
    )
  })

  test('should return value from getValue()', () => {
    // Arrange
    const urlStub = UrlStub.create('climbing-area-name')

    // Act
    const result = urlStub.getValue()

    // Assert
    expect(result).toBe('climbing-area-name')
  })
})
