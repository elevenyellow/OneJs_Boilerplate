import { describe, expect, test } from 'bun:test'
import { TopoDimensions } from '../topo-dimensions.vo'

describe('TopoDimensions Value Object', () => {
  // TEST CASES LIST (REASON)
  // Order: simple → complex
  //
  // 1. ✓ Create TopoDimensions with display and original dimensions
  // 2. ✓ Get display width
  // 3. ✓ Get display height
  // 4. ✓ Get original width
  // 5. ✓ Get original height
  // 6. ✓ Get view scale
  // 7. ✓ Calculate original dimensions from display dimensions and scale
  // 8. ✓ Calculate view scale from display and original dimensions
  // 9. ✓ Throw error for negative dimensions
  // 10. ✓ Throw error for zero dimensions
  // 11. ✓ Compare two TopoDimensions for equality
  // 12. ✓ Get aspect ratio

  test('should create TopoDimensions with all dimensions', () => {
    // Arrange & Act
    const dimensions = TopoDimensions.create(600, 400, 2.0, 1200, 800)

    // Assert
    expect(dimensions).toBeInstanceOf(TopoDimensions)
  })

  test('should get display width', () => {
    // Arrange
    const dimensions = TopoDimensions.create(600, 400, 2.0, 1200, 800)

    // Act
    const displayWidth = dimensions.getDisplayWidth()

    // Assert
    expect(displayWidth).toBe(600)
  })

  test('should get display height', () => {
    // Arrange
    const dimensions = TopoDimensions.create(600, 400, 2.0, 1200, 800)

    // Act
    const displayHeight = dimensions.getDisplayHeight()

    // Assert
    expect(displayHeight).toBe(400)
  })

  test('should get original width', () => {
    // Arrange
    const dimensions = TopoDimensions.create(600, 400, 2.0, 1200, 800)

    // Act
    const originalWidth = dimensions.getOriginalWidth()

    // Assert
    expect(originalWidth).toBe(1200)
  })

  test('should get original height', () => {
    // Arrange
    const dimensions = TopoDimensions.create(600, 400, 2.0, 1200, 800)

    // Act
    const originalHeight = dimensions.getOriginalHeight()

    // Assert
    expect(originalHeight).toBe(800)
  })

  test('should get view scale', () => {
    // Arrange
    const dimensions = TopoDimensions.create(600, 400, 2.0, 1200, 800)

    // Act
    const viewScale = dimensions.getViewScale()

    // Assert
    expect(viewScale).toBe(2.0)
  })

  test('should calculate original dimensions from display dimensions and scale', () => {
    // Arrange & Act
    const dimensions = TopoDimensions.fromDisplayWithScale(600, 400, 2.0)

    // Assert
    expect(dimensions.getOriginalWidth()).toBe(1200)
    expect(dimensions.getOriginalHeight()).toBe(800)
  })

  test('should calculate view scale from display and original dimensions', () => {
    // Arrange & Act
    const dimensions = TopoDimensions.fromDimensions(600, 400, 1200, 800)

    // Assert
    expect(dimensions.getViewScale()).toBe(2.0)
  })

  test('should throw error for negative display width', () => {
    // Act & Assert
    expect(() => TopoDimensions.create(-600, 400, 2.0, 1200, 800)).toThrow(
      'Invalid dimensions',
    )
  })

  test('should throw error for zero display height', () => {
    // Act & Assert
    expect(() => TopoDimensions.create(600, 0, 2.0, 1200, 800)).toThrow(
      'Invalid dimensions',
    )
  })

  test('should compare two TopoDimensions for equality', () => {
    // Arrange
    const dim1 = TopoDimensions.create(600, 400, 2.0, 1200, 800)
    const dim2 = TopoDimensions.create(600, 400, 2.0, 1200, 800)
    const dim3 = TopoDimensions.create(600, 401, 2.0, 1200, 802)

    // Assert
    expect(dim1.equals(dim2)).toBe(true)
    expect(dim1.equals(dim3)).toBe(false)
  })

  test('should get aspect ratio', () => {
    // Arrange
    const dimensions = TopoDimensions.create(800, 600, 1.0, 800, 600)

    // Act
    const aspectRatio = dimensions.getAspectRatio()

    // Assert
    expect(aspectRatio).toBeCloseTo(1.333, 2)
  })

  test('should calculate scale factor to fit in target dimensions', () => {
    // Arrange
    const dimensions = TopoDimensions.create(600, 400, 2.0, 1200, 800)

    // Act
    const scaleFactor = dimensions.getScaleToFit(300, 200)

    // Assert
    expect(scaleFactor).toBe(0.5)
  })
})
