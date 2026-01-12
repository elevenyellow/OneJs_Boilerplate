import { describe, expect, test } from 'bun:test'
import { AreaBeta } from '../../value-objects/area-beta.vo'
import { AreaName } from '../../value-objects/area-name.vo'
import { AreaSlug } from '../../value-objects/area-slug.vo'
import { AreaUrl } from '../../value-objects/area-url.vo'
import { NodeId } from '../../value-objects/node-id.vo'
import { NodeMetadata } from '../../value-objects/node-metadata.vo'
import { NodeSeasonality } from '../../value-objects/node-seasonality.vo'
import { NodeStatistics } from '../../value-objects/node-statistics.vo'
import { NodeTags } from '../../value-objects/node-tags.vo'
import { RawHtmlResponse } from '../../value-objects/raw-html-response.vo'
import { RawNodeResponse } from '../../value-objects/raw-node-response.vo'
import { TopoAnnotation } from '../../value-objects/topo-annotation.vo'
import { TopoDimensions } from '../../value-objects/topo-dimensions.vo'
import { TopoImage } from '../../value-objects/topo-image.vo'
import { ScrapedArea } from '../scraped-area.entity'

describe('ScrapedArea Entity', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create ScrapedArea with minimal data
  // 2. ✓ Get basic properties (id, name, slug, url)
  // 3. ✓ Get statistics
  // 4. ✓ Get seasonality
  // 5. ✓ Get tags
  // 6. ✓ Get metadata
  // 7. ✓ Get webcover image
  // 8. ✓ Get topo images
  // 9. ✓ Get raw responses
  // 10. ✓ Get child IDs
  // 11. ✓ Convenience getters for stats (getRoutesCount, etc.)
  // 12. ✓ Check if has topos
  // 13. ✓ Check if is kid/dog friendly

  const sampleNodeId = NodeId.createFrom('17857049')
  const sampleName = AreaName.createFrom('Cheste')
  const sampleSlug = AreaSlug.createFrom('cheste')
  const sampleUrl = AreaUrl.createFrom('/climbing/spain/cheste')
  const sampleBeta = AreaBeta.create(
    'Small crag with short routes for beginners.',
    'A small crag about 40 minutes from Valencia near Cheste.',
    'Small parking lot at coordinates, very near the climbing area.',
  )
  const sampleStats = NodeStatistics.create(42, 979, 6, 32, 1502)
  const sampleSeasonality = NodeSeasonality.create([
    113, 67, 47, 110, 83, 82, 26, 8, 67, 138, 111, 123,
  ])
  const sampleTags = NodeTags.fromApiTags({
    Aspect: { SW: { id: 1, name: 'SW' } },
    Family: { 'Kid friendly': { id: 2, name: 'Kid friendly', hasIcon: 1 } },
    'Walk in time': { '<5 min': { id: 3, name: '<5 min' } },
  })
  const sampleMetadata = NodeMetadata.create(5, 17, 'Emerging', true, 80, 50)
  const sampleRawNode = RawNodeResponse.fromApiResponse({
    id: 17857049,
    name: 'Cheste',
  })
  const sampleRawHtml = RawHtmlResponse.create(
    '<html><body>Test</body></html>',
    'https://www.thecrag.com/climbing/spain/cheste',
  )

  test('should create ScrapedArea with minimal data', () => {
    // Act
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      null,
      null,
      null,
      null,
      null,
      null,
      [],
      [],
      null,
      null,
    )

    // Assert
    expect(area).toBeInstanceOf(ScrapedArea)
  })

  test('should get basic properties', () => {
    // Arrange
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      null,
      null,
      null,
      null,
      null,
      null,
      [],
      [],
      null,
      null,
    )

    // Act & Assert
    expect(area.getId().toString()).toBe('17857049')
    expect(area.getName().toString()).toBe('Cheste')
    expect(area.getSlug().toString()).toBe('cheste')
    expect(area.getUrl().toString()).toBe('/climbing/spain/cheste')
  })

  test('should get beta information (summary, description, approach)', () => {
    // Arrange
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      null,
      null,
      null,
      null,
      null,
      null,
      [],
      [],
      null,
      null,
    )

    // Act & Assert
    expect(area.getBeta()).toBe(sampleBeta)
    expect(area.getSummary()).toBe(
      'Small crag with short routes for beginners.',
    )
    expect(area.getDescription()).toBe(
      'A small crag about 40 minutes from Valencia near Cheste.',
    )
    expect(area.getApproach()).toBe(
      'Small parking lot at coordinates, very near the climbing area.',
    )
    expect(area.hasBeta()).toBe(true)
  })

  test('should handle empty beta', () => {
    // Arrange
    const emptyBeta = AreaBeta.empty()
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      emptyBeta,
      null,
      null,
      null,
      null,
      null,
      null,
      [],
      [],
      null,
      null,
    )

    // Act & Assert
    expect(area.getSummary()).toBeNull()
    expect(area.getDescription()).toBeNull()
    expect(area.getApproach()).toBeNull()
    expect(area.hasBeta()).toBe(false)
  })

  test('should get statistics', () => {
    // Arrange
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      sampleStats,
      null,
      null,
      null,
      null,
      null,
      [],
      [],
      null,
      null,
    )

    // Act
    const stats = area.getStatistics()

    // Assert
    expect(stats).not.toBeNull()
    expect(stats?.getRoutes()).toBe(42)
    expect(stats?.getAscents()).toBe(979)
  })

  test('should get seasonality', () => {
    // Arrange
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      null,
      sampleSeasonality,
      null,
      null,
      null,
      null,
      [],
      [],
      null,
      null,
    )

    // Act
    const seasonality = area.getSeasonality()

    // Assert
    expect(seasonality).not.toBeNull()
    expect(seasonality?.getBestMonth()).toBe('October')
  })

  test('should get tags', () => {
    // Arrange
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      null,
      null,
      sampleTags,
      null,
      null,
      null,
      [],
      [],
      null,
      null,
    )

    // Act
    const tags = area.getTags()

    // Assert
    expect(tags).not.toBeNull()
    expect(tags?.getAspect()).toBe('SW')
  })

  test('should get metadata', () => {
    // Arrange
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      null,
      null,
      null,
      sampleMetadata,
      null,
      null,
      [],
      [],
      null,
      null,
    )

    // Act
    const metadata = area.getMetadata()

    // Assert
    expect(metadata).not.toBeNull()
    expect(metadata?.getDepth()).toBe(5)
    expect(metadata?.isTLC()).toBe(true)
  })

  test('should get raw responses', () => {
    // Arrange
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      null,
      null,
      null,
      null,
      null,
      null,
      [],
      [],
      sampleRawNode,
      sampleRawHtml,
    )

    // Act
    const rawNode = area.getRawNodeResponse()
    const rawHtml = area.getRawHtmlResponse()

    // Assert
    expect(rawNode).not.toBeNull()
    expect(rawNode?.getNodeName()).toBe('Cheste')
    expect(rawHtml).not.toBeNull()
    expect(rawHtml?.getUrl()).toBe(
      'https://www.thecrag.com/climbing/spain/cheste',
    )
  })

  test('should get child IDs', () => {
    // Arrange
    const childIds = [
      NodeId.createFrom('123'),
      NodeId.createFrom('456'),
      NodeId.createFrom('789'),
    ]
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      null,
      null,
      null,
      null,
      null,
      null,
      [],
      childIds,
      null,
      null,
    )

    // Act
    const returnedChildIds = area.getChildIds()

    // Assert
    expect(returnedChildIds).toHaveLength(3)
    expect(returnedChildIds[0].toString()).toBe('123')
  })

  test('should have convenience getters for stats', () => {
    // Arrange
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      sampleStats,
      null,
      null,
      null,
      null,
      null,
      [],
      [],
      null,
      null,
    )

    // Act & Assert
    expect(area.getRoutesCount()).toBe(42)
    expect(area.getAscentsCount()).toBe(979)
    expect(area.getPhotosCount()).toBe(6)
    expect(area.getKudosCount()).toBe(1502)
  })

  test('should return null counts when no statistics', () => {
    // Arrange
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      null,
      null,
      null,
      null,
      null,
      null,
      [],
      [],
      null,
      null,
    )

    // Act & Assert
    expect(area.getRoutesCount()).toBeNull()
  })

  test('should check if has topos', () => {
    // Arrange
    const dimensions = TopoDimensions.create(600, 400, 2.0, 1200, 800)
    const annotations = TopoAnnotation.parseFromTopoDataJson(
      JSON.stringify([
        {
          id: 1,
          type: 'route',
          num: '1',
          grade: '5a',
          class: 'gb2',
          zindex: '1',
          name: 'Route 1',
          stars: '1',
          style: 'Sport',
          order: 0,
          url: '/route/1',
          points: '100 200,150 250',
        },
      ]),
    )
    const topoImage = TopoImage.create(
      'topo-123',
      dimensions,
      'https://example.com/thumb.jpg',
      'https://example.com/full.jpg',
      annotations,
    )
    const areaWithTopos = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      null,
      null,
      null,
      null,
      null,
      null,
      [topoImage],
      [],
      null,
      null,
    )
    const areaWithoutTopos = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      null,
      null,
      null,
      null,
      null,
      null,
      [],
      [],
      null,
      null,
    )

    // Act & Assert
    expect(areaWithTopos.hasTopos()).toBe(true)
    expect(areaWithoutTopos.hasTopos()).toBe(false)
  })

  test('should check if is kid friendly', () => {
    // Arrange
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      null,
      null,
      sampleTags,
      null,
      null,
      null,
      [],
      [],
      null,
      null,
    )

    // Act & Assert
    expect(area.isKidFriendly()).toBe(true)
  })

  test('should return false for kid friendly when no tags', () => {
    // Arrange
    const area = ScrapedArea.create(
      sampleNodeId,
      sampleName,
      sampleSlug,
      sampleUrl,
      sampleBeta,
      null,
      null,
      null,
      null,
      null,
      null,
      [],
      [],
      null,
      null,
    )

    // Act & Assert
    expect(area.isKidFriendly()).toBe(false)
  })
})
