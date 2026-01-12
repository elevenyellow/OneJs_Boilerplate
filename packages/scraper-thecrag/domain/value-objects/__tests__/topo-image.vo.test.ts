import { describe, expect, test } from 'bun:test'
import { TopoImage } from '../topo-image.vo'
import { TopoAnnotation } from '../topo-annotation.vo'
import { TopoDimensions } from '../topo-dimensions.vo'

describe('TopoImage Value Object', () => {
  // TEST CASES LIST (REASON)
  // Order: simple → complex
  //
  // 1. ✓ Create TopoImage with all components
  // 2. ✓ Get topo id
  // 3. ✓ Get dimensions
  // 4. ✓ Get thumbnail URL
  // 5. ✓ Get full image URL
  // 6. ✓ Get annotations
  // 7. ✓ Get route annotations only
  // 8. ✓ Get area annotations only
  // 9. ✓ Generate basic SVG
  // 10. ✓ Generate SVG with route lines and colors
  // 11. ✓ Generate SVG with route numbers
  // 12. ✓ Generate SVG with area polygons
  // 13. ✓ Count routes and areas

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

  test('should create TopoImage with all components', () => {
    // Act
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      sampleAnnotations,
    )

    // Assert
    expect(topoImage).toBeInstanceOf(TopoImage)
  })

  test('should get topo id', () => {
    // Arrange
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      sampleAnnotations,
    )

    // Act & Assert
    expect(topoImage.getTopoId()).toBe('topo-123')
  })

  test('should get dimensions', () => {
    // Arrange
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      sampleAnnotations,
    )

    // Act
    const dimensions = topoImage.getDimensions()

    // Assert
    expect(dimensions.getDisplayWidth()).toBe(600)
    expect(dimensions.getOriginalWidth()).toBe(1200)
  })

  test('should get thumbnail URL', () => {
    // Arrange
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      sampleAnnotations,
    )

    // Act & Assert
    expect(topoImage.getThumbnailUrl()).toBe('https://example.com/thumb.jpg')
  })

  test('should get full image URL', () => {
    // Arrange
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      sampleAnnotations,
    )

    // Act & Assert
    expect(topoImage.getFullImageUrl()).toBe('https://example.com/full.jpg')
  })

  test('should get annotations', () => {
    // Arrange
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      sampleAnnotations,
    )

    // Act
    const annotations = topoImage.getAnnotations()

    // Assert
    expect(annotations).toHaveLength(3)
  })

  test('should get route annotations only', () => {
    // Arrange
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
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
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
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
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
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
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
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
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
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
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
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
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      sampleAnnotations,
    )

    // Act & Assert
    expect(topoImage.getRouteCount()).toBe(2)
    expect(topoImage.getAreaCount()).toBe(1)
  })

  test('should generate SVG without numbers when disabled', () => {
    // Arrange
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      sampleAnnotations,
    )

    // Act
    const svg = topoImage.generateSvg({ showNumbers: false })

    // Assert
    expect(svg).not.toContain('<text')
  })

  test('should generate SVG with custom line width', () => {
    // Arrange
    const topoImage = TopoImage.create(
      'topo-123',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      sampleAnnotations,
    )

    // Act
    const svg = topoImage.generateSvg({ lineWidth: 4 })

    // Assert
    expect(svg).toContain('stroke-width="4"')
  })

  test('should create TopoImage with empty annotations', () => {
    // Act
    const topoImage = TopoImage.create(
      'topo-empty',
      sampleDimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      [],
    )

    // Assert
    expect(topoImage.getAnnotations()).toHaveLength(0)
    expect(topoImage.getRouteCount()).toBe(0)
    expect(topoImage.getAreaCount()).toBe(0)
  })
})
