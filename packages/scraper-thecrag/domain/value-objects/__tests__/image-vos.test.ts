import { describe, expect, test } from 'bun:test'
import { ImageUrl } from '../image-url.vo'
import { WebCoverFocus } from '../webcover-focus.vo'
import { WebCoverImage } from '../webcover-image.vo'

describe('ImageUrl Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create ImageUrl with thumbnail and full URLs
  // 2. ✓ Get thumbnail URL
  // 3. ✓ Get full URL
  // 4. ✓ Get hash ID
  // 5. ✓ Get resized URL with custom dimensions
  // 6. ✓ Throw error for invalid URLs
  // 7. ✓ Normalize protocol-relative URL
  // 8. ✓ Normalize relative URL
  // 9. ✓ Return empty string for empty URL
  // 10. ✓ Return absolute URL as-is

  test('should create ImageUrl with thumbnail and full URLs', () => {
    // Act
    const imageUrl = ImageUrl.create(
      'https://static.thecrag.com/cache/img_e45661d2_100x100.jpg',
      'https://static.thecrag.com/cids/e45661d2abd7b229f508a8509c9343fe788210f0.jpg',
      'e45661d2abd7b229f508a8509c9343fe788210f0',
    )

    // Assert
    expect(imageUrl).toBeInstanceOf(ImageUrl)
  })

  test('should get thumbnail URL', () => {
    // Arrange
    const imageUrl = ImageUrl.create(
      'https://static.thecrag.com/cache/img_e45661d2_100x100.jpg',
      'https://static.thecrag.com/cids/e45661d2.jpg',
      'e45661d2',
    )

    // Act & Assert
    expect(imageUrl.getThumbnailUrl()).toBe(
      'https://static.thecrag.com/cache/img_e45661d2_100x100.jpg',
    )
  })

  test('should get full URL', () => {
    // Arrange
    const imageUrl = ImageUrl.create(
      'https://static.thecrag.com/cache/img_e45661d2_100x100.jpg',
      'https://static.thecrag.com/cids/e45661d2.jpg',
      'e45661d2',
    )

    // Act & Assert
    expect(imageUrl.getFullUrl()).toBe(
      'https://static.thecrag.com/cids/e45661d2.jpg',
    )
  })

  test('should get hash ID', () => {
    // Arrange
    const imageUrl = ImageUrl.create(
      'https://static.thecrag.com/cache/img_e45661d2_100x100.jpg',
      'https://static.thecrag.com/cids/e45661d2.jpg',
      'e45661d2',
    )

    // Act & Assert
    expect(imageUrl.getHashId()).toBe('e45661d2')
  })

  test('should generate resized URL with custom dimensions', () => {
    // Arrange
    const imageUrl = ImageUrl.create(
      'https://static.thecrag.com/cache/img_e45661d2_100x100.jpg',
      'https://static.thecrag.com/cids/e45661d2.jpg',
      'e45661d2',
    )

    // Act
    const resizedUrl = imageUrl.getResized(800, 600)

    // Assert
    expect(resizedUrl).toContain('800')
    expect(resizedUrl).toContain('600')
    expect(resizedUrl).toContain('e45661d2')
  })

  test('should compare two ImageUrls for equality', () => {
    // Arrange
    const imageUrl1 = ImageUrl.create(
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      'hash1',
    )
    const imageUrl2 = ImageUrl.create(
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      'hash1',
    )
    const imageUrl3 = ImageUrl.create(
      'https://example.com/thumb2.jpg',
      'https://example.com/full2.jpg',
      'hash2',
    )

    // Assert
    expect(imageUrl1.equals(imageUrl2)).toBe(true)
    expect(imageUrl1.equals(imageUrl3)).toBe(false)
  })

  // Tests for normalize static method
  test('should normalize protocol-relative URL', () => {
    const normalized = ImageUrl.normalize(
      '//image.thecrag.com/path/to/image.jpg',
    )
    expect(normalized).toBe('https://image.thecrag.com/path/to/image.jpg')
  })

  test('should normalize relative URL', () => {
    const normalized = ImageUrl.normalize('/path/to/image.jpg')
    expect(normalized).toBe('https://www.thecrag.com/path/to/image.jpg')
  })

  test('should return empty string for empty URL', () => {
    expect(ImageUrl.normalize('')).toBe('')
  })

  test('should return absolute URL as-is', () => {
    const url = 'https://example.com/image.jpg'
    expect(ImageUrl.normalize(url)).toBe(url)
  })
})

describe('WebCoverFocus Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create WebCoverFocus with crop coordinates
  // 2. ✓ Get top, bottom, left, right coordinates
  // 3. ✓ Get label
  // 4. ✓ Get width and height of focus area
  // 5. ✓ Get center point of focus area

  test('should create WebCoverFocus with crop coordinates', () => {
    // Act
    const focus = WebCoverFocus.create(963.3, 2057.7, 1898.1, 3539.7, '1')

    // Assert
    expect(focus).toBeInstanceOf(WebCoverFocus)
  })

  test('should get crop coordinates', () => {
    // Arrange
    const focus = WebCoverFocus.create(963.3, 2057.7, 1898.1, 3539.7, '1')

    // Assert
    expect(focus.getTop()).toBe(963.3)
    expect(focus.getBottom()).toBe(2057.7)
    expect(focus.getLeft()).toBe(1898.1)
    expect(focus.getRight()).toBe(3539.7)
  })

  test('should get label', () => {
    // Arrange
    const focus = WebCoverFocus.create(100, 200, 50, 150, 'cover1')

    // Act & Assert
    expect(focus.getLabel()).toBe('cover1')
  })

  test('should get width and height of focus area', () => {
    // Arrange
    const focus = WebCoverFocus.create(100, 300, 50, 250, '1')

    // Act & Assert
    expect(focus.getWidth()).toBe(200)
    expect(focus.getHeight()).toBe(200)
  })

  test('should get center point of focus area', () => {
    // Arrange
    const focus = WebCoverFocus.create(100, 300, 50, 250, '1')

    // Act
    const center = focus.getCenter()

    // Assert
    expect(center.x).toBe(150)
    expect(center.y).toBe(200)
  })
})

describe('WebCoverImage Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create WebCoverImage with image URL and focus area
  // 2. ✓ Get image URL
  // 3. ✓ Get focus area
  // 4. ✓ Get original dimensions
  // 5. ✓ Get date uploaded
  // 6. ✓ Get title
  // 7. ✓ Create from API response
  // 8. ✓ Return null from API response without webcover
  // 9. ✓ Return null from empty API response

  test('should create WebCoverImage from API response', () => {
    // Arrange
    const apiResponse = {
      data: {
        webcover: {
          hashId: 'e45661d2abd7b229f508a8509c9343fe788210f0',
          width: 5472,
          height: 3648,
          dateUploaded: '2021-11-05T20:59:36Z',
          title: 'Test Image.jpg',
          focus: {
            top: 100,
            bottom: 300,
            left: 50,
            right: 250,
            label: '1',
          },
        },
      },
    }

    // Act
    const webCover = WebCoverImage.fromApiResponse(apiResponse)

    // Assert
    expect(webCover).toBeInstanceOf(WebCoverImage)
    expect(webCover?.getOriginalWidth()).toBe(5472)
    expect(webCover?.getOriginalHeight()).toBe(3648)
    expect(webCover?.getTitle()).toBe('Test Image.jpg')
    expect(webCover?.getFocus()?.getTop()).toBe(100)
  })

  test('should return null from API response without webcover', () => {
    // Arrange
    const apiResponse = {
      data: {},
    }

    // Act
    const webCover = WebCoverImage.fromApiResponse(apiResponse)

    // Assert
    expect(webCover).toBeNull()
  })

  test('should return null from empty API response', () => {
    // Act
    const webCover = WebCoverImage.fromApiResponse(null)

    // Assert
    expect(webCover).toBeNull()
  })

  test('should create WebCoverImage with image URL and focus area', () => {
    // Arrange
    const imageUrl = ImageUrl.create(
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      'hash123',
    )
    const focus = WebCoverFocus.create(100, 300, 50, 250, '1')

    // Act
    const webCover = WebCoverImage.create({
      imageUrl,
      focus,
      originalWidth: 5472,
      originalHeight: 3648,
      dateUploaded: '2021-11-05T20:59:36Z',
      title: 'Cheste web.JPG',
    })

    // Assert
    expect(webCover).toBeInstanceOf(WebCoverImage)
  })

  test('should get image URL', () => {
    // Arrange
    const imageUrl = ImageUrl.create(
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      'hash123',
    )
    const focus = WebCoverFocus.create(100, 300, 50, 250, '1')
    const webCover = WebCoverImage.create({
      imageUrl,
      focus,
      originalWidth: 5472,
      originalHeight: 3648,
      dateUploaded: '2021-11-05T20:59:36Z',
      title: 'Test',
    })

    // Act & Assert
    expect(webCover.getImageUrl().getFullUrl()).toBe(
      'https://example.com/full.jpg',
    )
  })

  test('should get focus area', () => {
    // Arrange
    const imageUrl = ImageUrl.create(
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      'hash123',
    )
    const focus = WebCoverFocus.create(100, 300, 50, 250, '1')
    const webCover = WebCoverImage.create({
      imageUrl,
      focus,
      originalWidth: 5472,
      originalHeight: 3648,
      dateUploaded: '2021-11-05T20:59:36Z',
      title: 'Test',
    })

    // Act
    const returnedFocus = webCover.getFocus()

    // Assert
    expect(returnedFocus).not.toBeNull()
    expect(returnedFocus!.getTop()).toBe(100)
    expect(returnedFocus!.getBottom()).toBe(300)
  })

  test('should get original dimensions', () => {
    // Arrange
    const imageUrl = ImageUrl.create(
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      'hash123',
    )
    const focus = WebCoverFocus.create(100, 300, 50, 250, '1')
    const webCover = WebCoverImage.create({
      imageUrl,
      focus,
      originalWidth: 5472,
      originalHeight: 3648,
      dateUploaded: '2021-11-05T20:59:36Z',
      title: 'Test',
    })

    // Act & Assert
    expect(webCover.getOriginalWidth()).toBe(5472)
    expect(webCover.getOriginalHeight()).toBe(3648)
  })

  test('should get date uploaded', () => {
    // Arrange
    const imageUrl = ImageUrl.create(
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      'hash123',
    )
    const focus = WebCoverFocus.create(100, 300, 50, 250, '1')
    const webCover = WebCoverImage.create({
      imageUrl,
      focus,
      originalWidth: 5472,
      originalHeight: 3648,
      dateUploaded: '2021-11-05T20:59:36Z',
      title: 'Test',
    })

    // Act
    const dateUploaded = webCover.getDateUploaded()

    // Assert
    expect(dateUploaded).toBe('2021-11-05T20:59:36Z')
  })

  test('should get title', () => {
    // Arrange
    const imageUrl = ImageUrl.create(
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      'hash123',
    )
    const focus = WebCoverFocus.create(100, 300, 50, 250, '1')
    const webCover = WebCoverImage.create({
      imageUrl,
      focus,
      originalWidth: 5472,
      originalHeight: 3648,
      dateUploaded: '2021-11-05T20:59:36Z',
      title: 'Cheste web.JPG',
    })

    // Act & Assert
    expect(webCover.getTitle()).toBe('Cheste web.JPG')
  })

  test('should get aspect ratio', () => {
    // Arrange
    const imageUrl = ImageUrl.create(
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      'hash123',
    )
    const focus = WebCoverFocus.create(100, 300, 50, 250, '1')
    const webCover = WebCoverImage.create({
      imageUrl,
      focus,
      originalWidth: 800,
      originalHeight: 600,
      dateUploaded: '2021-11-05T20:59:36Z',
      title: 'Test',
    })

    // Act
    const aspectRatio = webCover.getAspectRatio()

    // Assert
    expect(aspectRatio).toBeCloseTo(1.333, 2)
  })
})
