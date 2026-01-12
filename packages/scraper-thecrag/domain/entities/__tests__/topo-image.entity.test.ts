import { describe, expect, test } from 'bun:test'
import { TopoImage } from '../topo-image.entity'
import { TopoId } from '../../value-objects/topo-id.vo'
import { TopoImageUrl } from '../../value-objects/topo-image-url.vo'
import { TopoDimensions } from '../../value-objects/topo-dimensions.vo'
import { TopoAnnotation } from '../../value-objects/topo-annotation.vo'

describe('TopoImage Entity', () => {
  // TEST CASES LIST (REASON)
  // Order: simple → complex
  //
  // 1. ✓ Create TopoImage entity with all components
  // 2. ✓ Get id (TopoId value object)
  // 3. ✓ Get dimensions
  // 4. ✓ Get thumbnail URL (TopoImageUrl value object)
  // 5. ✓ Get full image URL (TopoImageUrl value object)
  // 6. ✓ Get annotations
  // 7. ✓ Get route annotations only
  // 8. ✓ Get area annotations only
  // 9. ✓ Generate basic SVG
  // 10. ✓ Generate SVG with route lines and colors
  // 11. ✓ Generate SVG with route numbers
  // 12. ✓ Generate SVG with area polygons
  // 13. ✓ Count routes and areas
  // 14. ✓ Entity equality is based on id (not value)

  const sampleDimensions = TopoDimensions.create(600, 400, 2.0, 1200, 800)

  const sampleAnnotationsJson = JSON.stringify([
    {
      id: 1,
      type: 'route',
      num: '1',
      grade: '5a',
      class: 'gb2',
      zindex: '1',
      name: 'Easy Route',
      stars: '2',
      style: 'Sport',
      order: 0,
      url: '/route/1',
      points: '100 300,120 200,140 100',
    },
    {
      id: 2,
      type: 'route',
      num: '2',
      grade: '6b',
      class: 'gb3',
      zindex: '2',
      name: 'Medium Route',
      stars: '3',
      style: 'Sport',
      order: 1,
      url: '/route/2',
      points: '200 300,220 200,240 100',
    },
    {
      id: 3,
      type: 'area',
      num: '',
      grade: '',
      class: '',
      zindex: '',
      name: 'Sector A',
      stars: '',
      style: '',
      order: 2,
      url: '/area/3',
      points: '50 50,0 100,100 100,100 0,0 0',
    },
  ])

  const sampleAnnotations = TopoAnnotation.parseFromTopoDataJson(
    sampleAnnotationsJson,
  )

  test('should create TopoImage entity with all components', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')

    // Act
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Assert
    expect(topoImage).toBeInstanceOf(TopoImage)
  })

  test('should get id as TopoId value object', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const result = topoImage.getId()

    // Assert
    expect(result).toBeInstanceOf(TopoId)
    expect(result.getValue()).toBe('topo-123')
  })

  test('should get dimensions', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const dimensions = topoImage.getDimensions()

    // Assert
    expect(dimensions.getDisplayWidth()).toBe(600)
    expect(dimensions.getOriginalWidth()).toBe(1200)
  })

  test('should get thumbnail URL as TopoImageUrl value object', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const result = topoImage.getThumbnailUrl()

    // Assert
    expect(result).toBeInstanceOf(TopoImageUrl)
    expect(result.getValue()).toBe('https://example.com/thumb.jpg')
  })

  test('should get full image URL as TopoImageUrl value object', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const result = topoImage.getFullImageUrl()

    // Assert
    expect(result).toBeInstanceOf(TopoImageUrl)
    expect(result.getValue()).toBe('https://example.com/full.jpg')
  })

  test('should get annotations', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const annotations = topoImage.getAnnotations()

    // Assert
    expect(annotations).toHaveLength(3)
  })

  test('should get route annotations only', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const routes = topoImage.getRouteAnnotations()

    // Assert
    expect(routes).toHaveLength(2)
    expect(routes[0].isRoute()).toBe(true)
    expect(routes[1].isRoute()).toBe(true)
  })

  test('should get area annotations only', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const areas = topoImage.getAreaAnnotations()

    // Assert
    expect(areas).toHaveLength(1)
    expect(areas[0].isArea()).toBe(true)
  })

  test('should generate basic SVG with viewBox', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const svg = topoImage.generateSvg()

    // Assert
    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox="0 0 1200 800"')
    expect(svg).toContain('</svg>')
  })

  test('should generate SVG with route lines and colors', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const svg = topoImage.generateSvg()

    // Assert
    expect(svg).toContain('<path')
    expect(svg).toContain('stroke=')
    expect(svg).toContain('M 100 300 L 120 200 L 140 100') // Route 1 path
    expect(svg).toContain('M 200 300 L 220 200 L 240 100') // Route 2 path
  })

  test('should generate SVG with route numbers', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const svg = topoImage.generateSvg({ showNumbers: true })

    // Assert
    expect(svg).toContain('<text')
    expect(svg).toContain('>1<')
    expect(svg).toContain('>2<')
  })

  test('should generate SVG with area polygons', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const svg = topoImage.generateSvg()

    // Assert
    expect(svg).toContain('<polygon')
    expect(svg).toContain('points="50,50 0,100 100,100 100,0 0,0"')
  })

  test('should count routes and areas', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act & Assert
    expect(topoImage.getRouteCount()).toBe(2)
    expect(topoImage.getAreaCount()).toBe(1)
  })

  test('entity equality is based on id (not value)', () => {
    // Arrange
    const id1 = TopoId.create('topo-123')
    const id2 = TopoId.create('topo-123')
    const id3 = TopoId.create('topo-456')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')

    const topo1 = TopoImage.create(
      id1,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    const topo2 = TopoImage.create(
      id2,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      [], // Different annotations
    )

    const topo3 = TopoImage.create(
      id3,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act & Assert
    // Same ID = equal (entity identity)
    expect(topo1.equals(topo2)).toBe(true)
    // Different ID = not equal
    expect(topo1.equals(topo3)).toBe(false)
  })

  test('should generate SVG without numbers when disabled', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const svg = topoImage.generateSvg({ showNumbers: false })

    // Assert
    expect(svg).not.toContain('<text')
  })

  test('should generate SVG with custom line width', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const svg = topoImage.generateSvg({ lineWidth: 4 })

    // Assert
    expect(svg).toContain('stroke-width="4"')
  })

  test('should create TopoImage with empty annotations', () => {
    // Arrange
    const id = TopoId.create('topo-empty')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')

    // Act
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      [],
    )

    // Assert
    expect(topoImage.getAnnotations()).toHaveLength(0)
    expect(topoImage.getRouteCount()).toBe(0)
    expect(topoImage.getAreaCount()).toBe(0)
  })

  test('should convert to DTO', () => {
    // Arrange
    const id = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      id,
      sampleDimensions,
      thumbnailUrl,
      fullImageUrl,
      sampleAnnotations,
    )

    // Act
    const dto = topoImage.toDto()

    // Assert
    expect(dto.id).toBe('topo-123')
    expect(dto.thumbnailUrl).toBe('https://example.com/thumb.jpg')
    expect(dto.fullImageUrl).toBe('https://example.com/full.jpg')
    expect(dto.routeCount).toBe(2)
    expect(dto.areaCount).toBe(1)
  })
})
