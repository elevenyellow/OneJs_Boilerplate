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
import { NodeType } from '../../value-objects/node-type.vo'
import { RawHtmlResponse } from '../../value-objects/raw-html-response.vo'
import { RawNodeResponse } from '../../value-objects/raw-node-response.vo'
import { TopoDimensions } from '../../value-objects/topo-dimensions.vo'
import { TopoAnnotation } from '../../value-objects/topo-annotation.vo'
import { TopoId } from '../../value-objects/topo-id.vo'
import { TopoImageUrl } from '../../value-objects/topo-image-url.vo'
import type { ScrapedNode } from '../scraped-node.interface'
import { ScrapedArea } from '../scraped-area.entity'
import type { ScrapedRoute } from '../scraped-route.entity'
import { TopoImage } from '../topo-image.entity'

/**
 * Helper function to create a ScrapedArea with the new signature.
 * Uses sensible defaults for new required fields.
 */
function createTestArea(
  overrides: Partial<{
    id: NodeId
    type: NodeType
    name: AreaName
    slug: AreaSlug
    url: AreaUrl
    beta: AreaBeta
    statistics: NodeStatistics | null
    seasonality: NodeSeasonality | null
    tags: NodeTags | null
    metadata: NodeMetadata | null
    topoImages: TopoImage[]
    childIds: NodeId[]
    rawNodeResponse: RawNodeResponse | null
    rawHtmlResponse: RawHtmlResponse | null
  }> = {},
): ScrapedArea {
  return ScrapedArea.create(
    overrides.id ?? NodeId.createFrom('17857049'),
    overrides.type ?? NodeType.crag(),
    overrides.name ?? AreaName.createFrom('Test Area'),
    overrides.slug ?? AreaSlug.createFrom('test-area'),
    overrides.url ?? AreaUrl.createFrom('/climbing/test-area'),
    null, // info
    overrides.beta ?? AreaBeta.empty(),
    overrides.statistics ?? null,
    overrides.seasonality ?? null,
    overrides.tags ?? null,
    overrides.metadata ?? null,
    null, // webCoverImage
    null, // ogImage
    overrides.topoImages ?? [],
    [], // cragTopos
    [] as ScrapedRoute[], // routes
    [] as ScrapedNode[], // children
    overrides.childIds ?? [],
    overrides.rawNodeResponse ?? null,
    overrides.rawHtmlResponse ?? null,
  )
}

describe('ScrapedArea Entity', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create ScrapedArea with minimal data
  // 2. ✓ Get basic properties (id, name, slug, url)
  // 3. ✓ Get statistics
  // 4. ✓ Get seasonality
  // 5. ✓ Get tags
  // 6. ✓ Get metadata
  // 7. ✓ Get topo images
  // 8. ✓ Get raw responses
  // 9. ✓ Get child IDs
  // 10. ✓ Convenience getters for stats (getRoutesCount, etc.)
  // 11. ✓ Check if has topos
  // 12. ✓ Check if is kid/dog friendly

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
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
    })

    expect(area).toBeInstanceOf(ScrapedArea)
  })

  test('should get basic properties', () => {
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
    })

    expect(area.getId().toString()).toBe('17857049')
    expect(area.getName().toString()).toBe('Cheste')
    expect(area.getSlug().toString()).toBe('cheste')
    expect(area.getUrl().toString()).toBe('/climbing/spain/cheste')
  })

  test('should get beta information (summary, description, approach)', () => {
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
    })

    expect(area.getBeta()).toBe(sampleBeta)
    expect(area.getSummary()).toBe('Small crag with short routes for beginners.')
    expect(area.getDescription()).toBe(
      'A small crag about 40 minutes from Valencia near Cheste.',
    )
    expect(area.getApproach()).toBe(
      'Small parking lot at coordinates, very near the climbing area.',
    )
    expect(area.hasBeta()).toBe(true)
  })

  test('should handle empty beta', () => {
    const emptyBeta = AreaBeta.empty()
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: emptyBeta,
    })

    expect(area.getSummary()).toBeNull()
    expect(area.getDescription()).toBeNull()
    expect(area.getApproach()).toBeNull()
    expect(area.hasBeta()).toBe(false)
  })

  test('should get statistics', () => {
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
      statistics: sampleStats,
    })

    const stats = area.getStatistics()

    expect(stats).not.toBeNull()
    expect(stats?.getRoutes()).toBe(42)
    expect(stats?.getAscents()).toBe(979)
  })

  test('should get seasonality', () => {
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
      seasonality: sampleSeasonality,
    })

    const seasonality = area.getSeasonality()

    expect(seasonality).not.toBeNull()
    expect(seasonality?.getBestMonth()).toBe('October')
  })

  test('should get tags', () => {
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
      tags: sampleTags,
    })

    const tags = area.getTags()

    expect(tags).not.toBeNull()
    expect(tags?.getAspect()).toBe('SW')
  })

  test('should get metadata', () => {
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
      metadata: sampleMetadata,
    })

    const metadata = area.getMetadata()

    expect(metadata).not.toBeNull()
    expect(metadata?.getDepth()).toBe(5)
    expect(metadata?.isTLC()).toBe(true)
  })

  test('should get raw responses', () => {
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
      rawNodeResponse: sampleRawNode,
      rawHtmlResponse: sampleRawHtml,
    })

    const rawNode = area.getRawNodeResponse()
    const rawHtml = area.getRawHtmlResponse()

    expect(rawNode).not.toBeNull()
    expect(rawNode?.getNodeName()).toBe('Cheste')
    expect(rawHtml).not.toBeNull()
    expect(rawHtml?.getUrl()).toBe(
      'https://www.thecrag.com/climbing/spain/cheste',
    )
  })

  test('should get child IDs', () => {
    const childIds = [
      NodeId.createFrom('123'),
      NodeId.createFrom('456'),
      NodeId.createFrom('789'),
    ]
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
      childIds,
    })

    const returnedChildIds = area.getChildIds()

    expect(returnedChildIds).toHaveLength(3)
    expect(returnedChildIds[0].toString()).toBe('123')
  })

  test('should have convenience getters for stats', () => {
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
      statistics: sampleStats,
    })

    expect(area.getRoutesCount()).toBe(42)
    expect(area.getAscentsCount()).toBe(979)
    expect(area.getPhotosCount()).toBe(6)
    expect(area.getKudosCount()).toBe(1502)
  })

  test('should return null counts when no statistics', () => {
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
    })

    expect(area.getRoutesCount()).toBeNull()
  })

  test('should check if has topos', () => {
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
    const topoId = TopoId.create('topo-123')
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    const topoImage = TopoImage.create(
      topoId,
      dimensions,
      thumbnailUrl,
      fullImageUrl,
      annotations,
    )
    const areaWithTopos = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
      topoImages: [topoImage],
    })
    const areaWithoutTopos = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
      topoImages: [],
    })

    expect(areaWithTopos.hasTopos()).toBe(true)
    expect(areaWithoutTopos.hasTopos()).toBe(false)
  })

  test('should check if is kid friendly', () => {
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
      tags: sampleTags,
    })

    expect(area.isKidFriendly()).toBe(true)
  })

  test('should return false for kid friendly when no tags', () => {
    const area = createTestArea({
      id: sampleNodeId,
      name: sampleName,
      slug: sampleSlug,
      url: sampleUrl,
      beta: sampleBeta,
    })

    expect(area.isKidFriendly()).toBe(false)
  })
})
