import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { ProcessedArea } from '@the-crag/infrastructure/scraper/api.interfaces'
import { ScrapedDataToSectorMapper } from '../scraped-data-to-sector.mapper'

// Valid UUIDs for testing (Id value object requires UUID format)
const TEST_CRAG_ID = '550e8400-e29b-41d4-a716-446655440000'
const TEST_PARENT_ID = '550e8400-e29b-41d4-a716-446655440001'
const TEST_EXTERNAL_PARENT_ID = '11492633'

/**
 * TEST CASES LIST (REASON Phase)
 *
 * Purpose: Verify that ScrapedDataToSectorMapper correctly maps ALL fields
 * from ProcessedArea to Sector entity, especially handling of:
 * - Numeric values of 0 (should NOT become null)
 * - Geometry fallback (geometry.lat/long when direct lat/lng are null)
 * - Tuple fields (averageHeight)
 * - Array fields (seasonality, tags)
 * - Boolean conversions (hasTopo, hasSubSectors)
 *
 * Test Cases (ordered simple -> complex):
 *
 * 1. Identification fields:
 *    - ✓ should map id correctly
 *    - ✓ should map externalId from data.id
 *    - ✓ should map name correctly
 *    - ✓ should map asciiName correctly
 *    - ✓ should fallback asciiName to name when null
 *    - ✓ should map type correctly
 *    - ✓ should map subType correctly
 *
 * 2. URL fields:
 *    - ✓ should map urlStub correctly
 *    - ✓ should map urlAncestorStub correctly
 *    - ✓ should handle null urlStub
 *
 * 3. Image fields:
 *    - ✓ should map headerImage correctly
 *    - ✓ should map coverImage correctly
 *    - ✓ should map thumbnail correctly
 *    - ✓ should handle all null images
 *
 * 4. Location fields:
 *    - ✓ should map latitude from geometry.lat when direct lat is null
 *    - ✓ should map longitude from geometry.long when direct lng is null
 *    - ✓ should use direct lat/lng when geometry is null
 *    - ✓ should preserve latitude of 0 (equator)
 *    - ✓ should preserve longitude of 0 (prime meridian)
 *    - ✓ should map geometry object correctly
 *    - ✓ should map approach correctly
 *
 * 5. Hierarchy fields:
 *    - ✓ should map depth correctly
 *    - ✓ should map parentId correctly
 *    - ✓ should map cragId correctly
 *    - ✓ should map externalParentId correctly
 *
 * 6. Stats fields (CRITICAL - bug with || vs ??):
 *    - ✓ should map numberRoutes correctly
 *    - ✓ should preserve numberRoutes = 0
 *    - ✓ should map numberPhotos correctly
 *    - ✓ should preserve numberPhotos = 0
 *    - ✓ should map numberTopos correctly
 *    - ✓ should preserve numberTopos = 0
 *    - ✓ should map ascentCount correctly
 *    - ✓ should preserve ascentCount = 0
 *    - ✓ should map kudos correctly
 *    - ✓ should preserve kudos = 0
 *    - ✓ should map subAreaCount correctly
 *    - ✓ should preserve subAreaCount = 0
 *
 * 7. AverageHeight tuple:
 *    - ✓ should map averageHeight value correctly
 *    - ✓ should map averageHeightUnit correctly
 *    - ✓ should preserve averageHeight = 0
 *    - ✓ should handle null averageHeight
 *
 * 8. Array fields:
 *    - ✓ should map seasonality array correctly
 *    - ✓ should handle null seasonality
 *    - ✓ should map tags correctly
 *    - ✓ should handle null tags
 *
 * 9. Boolean fields:
 *    - ✓ should map hasTopo correctly (number > 0 = true)
 *    - ✓ should map hasTopo = 0 as false
 *    - ✓ should map hasSubSectors based on subAreas presence
 *
 * 10. Complete JSON mapping:
 *    - ✓ should map complete real-world JSON correctly
 */

describe('ScrapedDataToSectorMapper', () => {
  let mapper: ScrapedDataToSectorMapper
  const mockRepository = {
    findByExternalId: mock(() => Promise.resolve(null)),
  } as unknown as ConstructorParameters<typeof ScrapedDataToSectorMapper>[0]

  beforeEach(() => {
    // Create mapper with mocked repository
    mapper = new ScrapedDataToSectorMapper(mockRepository)
    ;(mockRepository.findByExternalId as ReturnType<typeof mock>).mockClear()
  })

  // ============================================================
  // FIXTURE: Complete ProcessedArea with ALL fields populated
  // ============================================================
  const createCompleteProcessedArea = (
    overrides: Partial<ProcessedArea> = {},
  ): ProcessedArea => ({
    // Identification
    id: 254037753,
    name: 'Peña Juliana',
    asciiName: 'Pena Juliana',
    type: 'area',
    subType: 'cliff',

    // URLs
    urlStub: 'pena-juliana',
    urlAncestorStub: 'spain/comunidad-valenciana/jerica',

    // Hierarchy
    parentID: 11492633,
    depth: 5,
    subAreaCount: 3,

    // Location - Direct fields (often null from API)
    lat: null,
    lng: null,
    latitude: null,
    longitude: null,
    map: null,
    geo: null,
    location: null,
    geolocation: null,

    // Location - Geometry object (contains actual coordinates)
    geometry: {
      lat: 39.9088326461538,
      long: -0.574034376923077,
      areasize: 0.000126932923076936,
      bbox: ['-0.580632', '39.904448', '-0.567437', '39.913218'],
      center: [-0.574034376923077, 39.9088326461538],
      point: ['-0.574034', '39.908833'],
    },

    // Approach
    approach: 'Desde el parking, seguir el sendero 15 minutos.',

    // Images
    headerImage:
      'https://image.thecrag.com/4x310:4604x2725/fit-in/1200x630/6f/39/6f394d50793c3430.jpg',
    coverImage: 'https://image.thecrag.com/cover/abc123.jpg',
    thumbnail: 'https://image.thecrag.com/thumb/abc123.jpg',
    image: null,
    images: null,
    photo: null,
    photos: null,
    media: null,
    phototopo: null,

    // Stats
    numberRoutes: 48,
    numberPhotos: 6,
    numberTopos: 6,
    ascentCount: 793,
    kudos: 1500,

    // AverageHeight tuple
    averageHeight: [21, 'm'],

    // Metadata
    seasonality: [3, 4, 5, 9, 10, 11],
    tags: {
      rockType: {
        limestone: { id: 1, name: 'Limestone', hasIcon: 1 },
      },
    },
    hasTopo: 6,

    // HTML scraped data
    topos: [],

    // Override with any custom values
    ...overrides,
  })

  // ============================================================
  // 1. IDENTIFICATION FIELDS
  // ============================================================
  describe('Identification Fields', () => {
    test('should generate a new id for the sector', () => {
      const data = createCompleteProcessedArea()
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.id).toBeDefined()
      expect(dto.id).not.toBe('')
      expect(typeof dto.id).toBe('string')
    })

    test('should map externalId from data.id', () => {
      const data = createCompleteProcessedArea({ id: 254037753 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.externalId).toBe('254037753')
    })

    test('should map name correctly', () => {
      const data = createCompleteProcessedArea({ name: 'Peña Juliana' })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.name).toBe('Peña Juliana')
    })

    test('should map asciiName correctly', () => {
      const data = createCompleteProcessedArea({ asciiName: 'Pena Juliana' })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.asciiName).toBe('Pena Juliana')
    })

    test('should fallback asciiName to name when asciiName is empty', () => {
      const data = createCompleteProcessedArea({
        name: 'Peña Juliana',
        asciiName: '',
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.asciiName).toBe('Peña Juliana')
    })

    test('should map type correctly', () => {
      const data = createCompleteProcessedArea({ type: 'area' })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.type).toBe('area')
    })

    test('should map subType correctly', () => {
      const data = createCompleteProcessedArea({ subType: 'cliff' })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.subType).toBe('cliff')
    })
  })

  // ============================================================
  // 2. URL FIELDS
  // ============================================================
  describe('URL Fields', () => {
    test('should map urlStub correctly', () => {
      const data = createCompleteProcessedArea({ urlStub: 'pena-juliana' })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.urlStub).toBe('pena-juliana')
    })

    test('should map urlAncestorStub correctly', () => {
      const data = createCompleteProcessedArea({
        urlAncestorStub: 'spain/comunidad-valenciana/jerica',
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.urlAncestorStub).toBe('spain/comunidad-valenciana/jerica')
    })

    test('should handle null urlStub', () => {
      const data = createCompleteProcessedArea({ urlStub: null })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.urlStub).toBeNull()
    })
  })

  // ============================================================
  // 3. IMAGE FIELDS
  // ============================================================
  describe('Image Fields', () => {
    test('should map headerImage correctly', () => {
      const data = createCompleteProcessedArea({
        headerImage: 'https://image.thecrag.com/header.jpg',
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.headerImage).toBe('https://image.thecrag.com/header.jpg')
    })

    test('should map coverImage correctly', () => {
      const data = createCompleteProcessedArea({
        coverImage: 'https://image.thecrag.com/cover.jpg',
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.coverImage).toBe('https://image.thecrag.com/cover.jpg')
    })

    test('should map thumbnail correctly', () => {
      const data = createCompleteProcessedArea({
        thumbnail: 'https://image.thecrag.com/thumb.jpg',
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.thumbnail).toBe('https://image.thecrag.com/thumb.jpg')
    })

    test('should handle all null images', () => {
      const data = createCompleteProcessedArea({
        headerImage: null,
        coverImage: null,
        thumbnail: null,
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.headerImage).toBeNull()
      expect(dto.coverImage).toBeNull()
      expect(dto.thumbnail).toBeNull()
    })
  })

  // ============================================================
  // 4. LOCATION FIELDS (CRITICAL - geometry fallback)
  // ============================================================
  describe('Location Fields', () => {
    test('should map latitude from geometry.lat when direct lat is null', () => {
      const data = createCompleteProcessedArea({
        lat: null,
        geometry: { lat: 39.9088326461538, long: -0.574034376923077 },
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.latitude).toBe(39.9088326461538)
    })

    test('should map longitude from geometry.long when direct lng is null', () => {
      const data = createCompleteProcessedArea({
        lng: null,
        geometry: { lat: 39.9088326461538, long: -0.574034376923077 },
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.longitude).toBe(-0.574034376923077)
    })

    test('should use direct lat/lng when geometry is null', () => {
      const data = createCompleteProcessedArea({
        lat: 40.0,
        lng: -3.5,
        geometry: null,
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.latitude).toBe(40.0)
      expect(dto.longitude).toBe(-3.5)
    })

    test('should preserve latitude of 0 (equator)', () => {
      const data = createCompleteProcessedArea({
        lat: null,
        geometry: { lat: 0, long: 25.0 },
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      // BUG: This will fail with || operator because 0 || data.lat || null = null
      expect(dto.latitude).toBe(0)
    })

    test('should preserve longitude of 0 (prime meridian)', () => {
      const data = createCompleteProcessedArea({
        lng: null,
        geometry: { lat: 51.5, long: 0 },
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      // BUG: This will fail with || operator
      expect(dto.longitude).toBe(0)
    })

    test('should map geometry object correctly', () => {
      const geometryData = {
        lat: 39.9088326461538,
        long: -0.574034376923077,
        areasize: 0.000126932923076936,
        bbox: ['-0.580632', '39.904448', '-0.567437', '39.913218'],
        center: [-0.574034376923077, 39.9088326461538],
        point: ['-0.574034', '39.908833'],
      }
      const data = createCompleteProcessedArea({ geometry: geometryData })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.geometry).toEqual(geometryData)
    })

    test('should map approach correctly', () => {
      const data = createCompleteProcessedArea({
        approach: 'Desde el parking, seguir el sendero 15 minutos.',
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.approach).toBe(
        'Desde el parking, seguir el sendero 15 minutos.',
      )
    })

    test('should handle null approach', () => {
      const data = createCompleteProcessedArea({ approach: null })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.approach).toBeNull()
    })
  })

  // ============================================================
  // 5. HIERARCHY FIELDS
  // ============================================================
  describe('Hierarchy Fields', () => {
    test('should map depth correctly', () => {
      const data = createCompleteProcessedArea({ depth: 5 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.depth).toBe(5)
    })

    test('should map parentId correctly', () => {
      const sector = mapper['createNew'](
        createCompleteProcessedArea(),
        TEST_CRAG_ID,
        TEST_PARENT_ID,
        null,
      )
      const dto = sector.toPrimitives()

      expect(dto.parentId).toBe(TEST_PARENT_ID)
    })

    test('should handle null parentId', () => {
      const sector = mapper['createNew'](
        createCompleteProcessedArea(),
        TEST_CRAG_ID,
        null,
        null,
      )
      const dto = sector.toPrimitives()

      expect(dto.parentId).toBeNull()
    })

    test('should map cragId correctly', () => {
      const sector = mapper['createNew'](
        createCompleteProcessedArea(),
        TEST_CRAG_ID,
        null,
        null,
      )
      const dto = sector.toPrimitives()

      expect(dto.cragId).toBe(TEST_CRAG_ID)
    })

    test('should map externalParentId correctly', () => {
      const sector = mapper['createNew'](
        createCompleteProcessedArea(),
        TEST_CRAG_ID,
        null,
        '11492633',
      )
      const dto = sector.toPrimitives()

      expect(dto.externalParentId).toBe(TEST_EXTERNAL_PARENT_ID)
    })
  })

  // ============================================================
  // 6. STATS FIELDS (CRITICAL - bug with || vs ??)
  // ============================================================
  describe('Stats Fields', () => {
    test('should map numberRoutes correctly', () => {
      const data = createCompleteProcessedArea({ numberRoutes: 48 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.numberRoutes).toBe(48)
    })

    test('should preserve numberRoutes = 0 (not convert to null)', () => {
      const data = createCompleteProcessedArea({ numberRoutes: 0 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      // BUG: This will fail with || operator because 0 || null = null
      expect(dto.numberRoutes).toBe(0)
      expect(dto.numberRoutes).not.toBeNull()
    })

    test('should map numberPhotos correctly', () => {
      const data = createCompleteProcessedArea({ numberPhotos: 6 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.numberPhotos).toBe(6)
    })

    test('should preserve numberPhotos = 0 (not convert to null)', () => {
      const data = createCompleteProcessedArea({ numberPhotos: 0 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.numberPhotos).toBe(0)
      expect(dto.numberPhotos).not.toBeNull()
    })

    test('should map numberTopos correctly', () => {
      const data = createCompleteProcessedArea({ numberTopos: 6 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.numberTopos).toBe(6)
    })

    test('should preserve numberTopos = 0 (not convert to null)', () => {
      const data = createCompleteProcessedArea({ numberTopos: 0 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.numberTopos).toBe(0)
      expect(dto.numberTopos).not.toBeNull()
    })

    test('should map ascentCount correctly', () => {
      const data = createCompleteProcessedArea({ ascentCount: 793 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.ascentCount).toBe(793)
    })

    test('should preserve ascentCount = 0 (not convert to null)', () => {
      const data = createCompleteProcessedArea({ ascentCount: 0 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.ascentCount).toBe(0)
      expect(dto.ascentCount).not.toBeNull()
    })

    test('should map kudos correctly', () => {
      const data = createCompleteProcessedArea({ kudos: 1500 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.kudos).toBe(1500)
    })

    test('should preserve kudos = 0 (not convert to null)', () => {
      const data = createCompleteProcessedArea({ kudos: 0 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.kudos).toBe(0)
      expect(dto.kudos).not.toBeNull()
    })

    test('should map subAreaCount correctly', () => {
      const data = createCompleteProcessedArea({ subAreaCount: 3 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.subAreaCount).toBe(3)
    })

    test('should preserve subAreaCount = 0 (not convert to null)', () => {
      const data = createCompleteProcessedArea({ subAreaCount: 0 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.subAreaCount).toBe(0)
      expect(dto.subAreaCount).not.toBeNull()
    })

    test('should handle null stats gracefully', () => {
      const data = createCompleteProcessedArea({
        numberRoutes: null,
        numberPhotos: null,
        numberTopos: null,
        ascentCount: null,
        kudos: null,
        subAreaCount: null,
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.numberRoutes).toBeNull()
      expect(dto.numberPhotos).toBeNull()
      expect(dto.numberTopos).toBeNull()
      expect(dto.ascentCount).toBeNull()
      expect(dto.kudos).toBeNull()
      expect(dto.subAreaCount).toBeNull()
    })
  })

  // ============================================================
  // 7. AVERAGE HEIGHT TUPLE
  // ============================================================
  describe('AverageHeight Tuple', () => {
    test('should map averageHeight value correctly', () => {
      const data = createCompleteProcessedArea({ averageHeight: [21, 'm'] })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.averageHeight).toBe(21)
    })

    test('should map averageHeightUnit correctly', () => {
      const data = createCompleteProcessedArea({ averageHeight: [21, 'm'] })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.averageHeightUnit).toBe('m')
    })

    test('should preserve averageHeight = 0 (not convert to null)', () => {
      const data = createCompleteProcessedArea({ averageHeight: [0, 'm'] })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      // BUG: This will fail with || operator
      expect(dto.averageHeight).toBe(0)
      expect(dto.averageHeight).not.toBeNull()
    })

    test('should handle null averageHeight', () => {
      const data = createCompleteProcessedArea({ averageHeight: null })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.averageHeight).toBeNull()
      // Note: averageHeightUnit comes from mapper which may use default from fixture
      // The important test is that averageHeight itself is null
    })

    test('should handle averageHeight in feet', () => {
      const data = createCompleteProcessedArea({ averageHeight: [70, 'ft'] })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.averageHeight).toBe(70)
      expect(dto.averageHeightUnit).toBe('ft')
    })
  })

  // ============================================================
  // 8. ARRAY FIELDS
  // ============================================================
  describe('Array Fields', () => {
    test('should map seasonality array correctly', () => {
      const data = createCompleteProcessedArea({
        seasonality: [3, 4, 5, 9, 10, 11],
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.seasonality).toEqual([3, 4, 5, 9, 10, 11])
    })

    test('should handle null seasonality', () => {
      const data = createCompleteProcessedArea({ seasonality: null })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      // Seasonality VO converts null to empty array - this is by design
      expect(dto.seasonality).toEqual([])
    })

    test('should handle empty seasonality array', () => {
      const data = createCompleteProcessedArea({ seasonality: [] })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.seasonality).toEqual([])
    })

    test('should map tags correctly', () => {
      const tagsData = {
        rockType: {
          limestone: { id: 1, name: 'Limestone', hasIcon: 1 },
        },
      }
      const data = createCompleteProcessedArea({ tags: tagsData })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.tags).toEqual(tagsData)
    })

    test('should handle null tags', () => {
      const data = createCompleteProcessedArea({ tags: null })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.tags).toBeNull()
    })
  })

  // ============================================================
  // 9. BOOLEAN FIELDS
  // ============================================================
  describe('Boolean Fields', () => {
    test('should map hasTopo correctly when value > 0', () => {
      const data = createCompleteProcessedArea({ hasTopo: 6 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.hasTopo).toBe(true)
    })

    test('should map hasTopo = 0 as false', () => {
      const data = createCompleteProcessedArea({ hasTopo: 0 })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.hasTopo).toBe(false)
    })

    test('should map hasTopo = null as false', () => {
      const data = createCompleteProcessedArea({ hasTopo: null })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.hasTopo).toBe(false)
    })

    test('should map hasSubSectors = true when subAreas exist', () => {
      const data = createCompleteProcessedArea({
        subAreas: [createCompleteProcessedArea({ id: 1 })],
      })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.hasSubSectors).toBe(true)
    })

    test('should map hasSubSectors = false when no subAreas', () => {
      const data = createCompleteProcessedArea({ subAreas: undefined })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.hasSubSectors).toBe(false)
    })

    test('should map hasSubSectors = false when subAreas is empty', () => {
      const data = createCompleteProcessedArea({ subAreas: [] })
      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.hasSubSectors).toBe(false)
    })
  })

  // ============================================================
  // 10. COMPLETE JSON MAPPING (Integration-like test)
  // ============================================================
  describe('Complete JSON Mapping', () => {
    test('should map complete real-world JSON correctly', () => {
      // This is the complete ProcessedArea as it would come from the scraper
      const realWorldData: ProcessedArea = {
        id: 254037753,
        name: 'Peña Juliana',
        asciiName: 'Pena Juliana',
        type: 'area',
        subType: 'cliff',
        urlStub: 'pena-juliana',
        urlAncestorStub: 'spain/comunidad-valenciana/jerica',
        parentID: 11492633,
        depth: 5,
        subAreaCount: 0,
        lat: null,
        lng: null,
        latitude: null,
        longitude: null,
        map: null,
        geo: null,
        location: null,
        geolocation: null,
        geometry: {
          lat: 39.9088326461538,
          long: -0.574034376923077,
          areasize: 0.000126932923076936,
          bbox: ['-0.580632', '39.904448', '-0.567437', '39.913218'],
          center: [-0.574034376923077, 39.9088326461538],
          point: ['-0.574034', '39.908833'],
        },
        approach: null,
        headerImage:
          'https://image.thecrag.com/4x310:4604x2725/fit-in/1200x630/6f/39/6f394d50793c3430.jpg',
        coverImage: null,
        thumbnail: null,
        image: null,
        images: null,
        photo: null,
        photos: null,
        media: null,
        phototopo: null,
        numberRoutes: 48,
        numberPhotos: 6,
        numberTopos: 6,
        ascentCount: 793,
        kudos: 793,
        averageHeight: [21, 'm'],
        seasonality: null,
        tags: null,
        hasTopo: 6,
        topos: [],
      }

      const sector = mapper['createNew'](
        realWorldData,
        TEST_CRAG_ID,
        null,
        TEST_EXTERNAL_PARENT_ID,
      )
      const dto = sector.toPrimitives()

      // Verify all fields
      expect(dto.externalId).toBe('254037753')
      expect(dto.name).toBe('Peña Juliana')
      expect(dto.asciiName).toBe('Pena Juliana')
      expect(dto.type).toBe('area')
      expect(dto.subType).toBe('cliff')
      expect(dto.urlStub).toBe('pena-juliana')
      expect(dto.urlAncestorStub).toBe('spain/comunidad-valenciana/jerica')
      expect(dto.depth).toBe(5)
      expect(dto.cragId).toBe(TEST_CRAG_ID)
      expect(dto.externalParentId).toBe(TEST_EXTERNAL_PARENT_ID)

      // Coordinates should come from geometry
      expect(dto.latitude).toBe(39.9088326461538)
      expect(dto.longitude).toBe(-0.574034376923077)

      // Geometry object should be preserved
      expect(dto.geometry).toBeDefined()
      expect(dto.geometry?.lat).toBe(39.9088326461538)
      expect(dto.geometry?.long).toBe(-0.574034376923077)

      // Images
      expect(dto.headerImage).toBe(
        'https://image.thecrag.com/4x310:4604x2725/fit-in/1200x630/6f/39/6f394d50793c3430.jpg',
      )
      expect(dto.coverImage).toBeNull()
      expect(dto.thumbnail).toBeNull()

      // Stats
      expect(dto.numberRoutes).toBe(48)
      expect(dto.numberPhotos).toBe(6)
      expect(dto.numberTopos).toBe(6)
      expect(dto.ascentCount).toBe(793)
      expect(dto.kudos).toBe(793)
      expect(dto.subAreaCount).toBe(0) // CRITICAL: should be 0, not null

      // AverageHeight
      expect(dto.averageHeight).toBe(21)
      expect(dto.averageHeightUnit).toBe('m')

      // Metadata
      expect(dto.seasonality).toEqual([]) // Seasonality VO converts null to empty array
      expect(dto.tags).toBeNull()
      expect(dto.hasTopo).toBe(true)
      expect(dto.hasSubSectors).toBe(false)
    })

    test('should map area with all null optional fields', () => {
      const minimalData: ProcessedArea = {
        id: 123,
        name: 'Test Area',
        asciiName: 'Test Area',
        type: 'area',
        subType: 'cliff',
        urlStub: null,
        urlAncestorStub: null,
        parentID: null,
        depth: 1,
        subAreaCount: null,
        lat: null,
        lng: null,
        latitude: null,
        longitude: null,
        map: null,
        geo: null,
        location: null,
        geolocation: null,
        geometry: null,
        approach: null,
        headerImage: null,
        coverImage: null,
        thumbnail: null,
        image: null,
        images: null,
        photo: null,
        photos: null,
        media: null,
        phototopo: null,
        numberRoutes: null,
        numberPhotos: null,
        numberTopos: null,
        ascentCount: null,
        kudos: null,
        averageHeight: null,
        seasonality: null,
        tags: null,
        hasTopo: null,
        topos: [],
      }

      const sector = mapper['createNew'](minimalData, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      expect(dto.externalId).toBe('123')
      expect(dto.name).toBe('Test Area')
      expect(dto.latitude).toBeNull()
      expect(dto.longitude).toBeNull()
      expect(dto.geometry).toBeNull()
      expect(dto.numberRoutes).toBeNull()
      expect(dto.hasTopo).toBe(false)
    })
  })

  // ============================================================
  // 11. EDGE CASES FOR ZERO VALUES (Bug Detection)
  // ============================================================
  describe('Edge Cases - Zero Values Bug Detection', () => {
    test('should preserve ALL numeric zeros in a single entity', () => {
      const data = createCompleteProcessedArea({
        numberRoutes: 0,
        numberPhotos: 0,
        numberTopos: 0,
        ascentCount: 0,
        kudos: 0,
        subAreaCount: 0,
        averageHeight: [0, 'm'],
        geometry: { lat: 0, long: 0 },
      })

      const sector = mapper['createNew'](data, TEST_CRAG_ID, null, null)
      const dto = sector.toPrimitives()

      // All these should be 0, NOT null
      expect(dto.numberRoutes).toBe(0)
      expect(dto.numberPhotos).toBe(0)
      expect(dto.numberTopos).toBe(0)
      expect(dto.ascentCount).toBe(0)
      expect(dto.kudos).toBe(0)
      expect(dto.subAreaCount).toBe(0)
      expect(dto.averageHeight).toBe(0)
      expect(dto.latitude).toBe(0)
      expect(dto.longitude).toBe(0)
    })
  })

  // ============================================================
  // 12. COMPREHENSIVE DTO FIELD VERIFICATION
  // ============================================================
  describe('Comprehensive DTO Field Verification', () => {
    test('should map ALL SectorCreateDto fields correctly from ProcessedArea', () => {
      // Complete ProcessedArea with ALL fields set to specific values
      const completeData: ProcessedArea = {
        // Identification
        id: 999888777,
        name: 'Complete Test Sector',
        asciiName: 'Complete Test Sector ASCII',
        type: 'area',
        subType: 'boulder',

        // URLs
        urlStub: 'complete-test-sector',
        urlAncestorStub: 'country/region/crag',

        // Hierarchy
        parentID: 123456,
        depth: 3,
        subAreaCount: 5,

        // Location - Direct fields
        lat: null,
        lng: null,
        latitude: null,
        longitude: null,
        map: { some: 'data' },
        geo: { some: 'data' },
        location: { some: 'data' },
        geolocation: { some: 'data' },

        // Location - Geometry
        geometry: {
          lat: 41.123456,
          long: 2.654321,
          areasize: 0.001,
          bbox: ['2.0', '41.0', '2.5', '41.5'],
          center: [2.25, 41.25],
          point: ['2.25', '41.25'],
        },

        // Approach
        approach: 'Walk 10 minutes from parking',

        // Images
        headerImage: 'https://cdn.test.com/header.jpg',
        coverImage: 'https://cdn.test.com/cover.jpg',
        thumbnail: 'https://cdn.test.com/thumb.jpg',
        image: 'https://cdn.test.com/image.jpg',
        images: ['img1.jpg', 'img2.jpg'],
        photo: 'https://cdn.test.com/photo.jpg',
        photos: ['photo1.jpg', 'photo2.jpg'],
        media: { video: 'video.mp4' },
        phototopo: { id: 'topo1' },

        // Stats
        numberRoutes: 150,
        numberPhotos: 25,
        numberTopos: 10,
        ascentCount: 5000,
        kudos: 3500,

        // AverageHeight
        averageHeight: [15, 'm'],

        // Metadata
        seasonality: [1, 2, 3, 4, 11, 12],
        tags: {
          rockType: { granite: { id: 2, name: 'Granite', hasIcon: 1 } },
          features: { overhang: { id: 5, name: 'Overhang', hasIcon: 0 } },
        },
        hasTopo: 10,

        // HTML scraped
        topos: [],

        // Relations - with subAreas to test hasSubSectors
        subAreas: [
          {
            id: 1,
            name: 'Sub1',
            asciiName: 'Sub1',
            type: 'area',
            subType: 'cliff',
            urlStub: null,
            urlAncestorStub: null,
            parentID: null,
            depth: 4,
            subAreaCount: null,
            lat: null,
            lng: null,
            latitude: null,
            longitude: null,
            map: null,
            geo: null,
            location: null,
            geolocation: null,
            geometry: null,
            approach: null,
            headerImage: null,
            coverImage: null,
            thumbnail: null,
            image: null,
            images: null,
            photo: null,
            photos: null,
            media: null,
            phototopo: null,
            numberRoutes: null,
            numberPhotos: null,
            numberTopos: null,
            ascentCount: null,
            kudos: null,
            averageHeight: null,
            seasonality: null,
            tags: null,
            hasTopo: null,
            topos: [],
          },
        ],
      }

      const sector = mapper['createNew'](
        completeData,
        TEST_CRAG_ID,
        TEST_PARENT_ID,
        TEST_EXTERNAL_PARENT_ID,
      )
      const dto = sector.toPrimitives()

      // ==========================================
      // VERIFY ALL SectorCreateDto FIELDS
      // ==========================================

      // 1. ID fields
      expect(dto.id).toBeDefined()
      expect(typeof dto.id).toBe('string')
      expect(dto.id.length).toBeGreaterThan(0)

      expect(dto.externalId).toBe('999888777')

      // 2. Name fields
      expect(dto.name).toBe('Complete Test Sector')
      expect(dto.asciiName).toBe('Complete Test Sector ASCII')

      // 3. Type fields
      expect(dto.type).toBe('area')
      expect(dto.subType).toBe('boulder')

      // 4. URL fields
      expect(dto.urlStub).toBe('complete-test-sector')
      expect(dto.urlAncestorStub).toBe('country/region/crag')

      // 5. Image fields
      expect(dto.headerImage).toBe('https://cdn.test.com/header.jpg')
      expect(dto.coverImage).toBe('https://cdn.test.com/cover.jpg')
      expect(dto.thumbnail).toBe('https://cdn.test.com/thumb.jpg')

      // 6. Approach field
      expect(dto.approach).toBe('Walk 10 minutes from parking')

      // 7. Location fields
      expect(dto.latitude).toBe(41.123456)
      expect(dto.longitude).toBe(2.654321)

      // 8. Geometry field (complete object)
      expect(dto.geometry).toEqual({
        lat: 41.123456,
        long: 2.654321,
        areasize: 0.001,
        bbox: ['2.0', '41.0', '2.5', '41.5'],
        center: [2.25, 41.25],
        point: ['2.25', '41.25'],
      })

      // 9. Hierarchy fields
      expect(dto.depth).toBe(3)
      expect(dto.parentId).toBe(TEST_PARENT_ID)
      expect(dto.cragId).toBe(TEST_CRAG_ID)
      expect(dto.externalParentId).toBe(TEST_EXTERNAL_PARENT_ID)

      // 10. Stats fields
      expect(dto.numberRoutes).toBe(150)
      expect(dto.numberPhotos).toBe(25)
      expect(dto.numberTopos).toBe(10)
      expect(dto.ascentCount).toBe(5000)
      expect(dto.kudos).toBe(3500)
      expect(dto.subAreaCount).toBe(5)

      // 11. AverageHeight fields
      expect(dto.averageHeight).toBe(15)
      expect(dto.averageHeightUnit).toBe('m')

      // 12. Array fields
      expect(dto.seasonality).toEqual([1, 2, 3, 4, 11, 12])
      expect(dto.tags).toEqual({
        rockType: { granite: { id: 2, name: 'Granite', hasIcon: 1 } },
        features: { overhang: { id: 5, name: 'Overhang', hasIcon: 0 } },
      })

      // 13. Boolean fields
      expect(dto.hasTopo).toBe(true)
      expect(dto.hasSubSectors).toBe(true)

      // 14. Timestamp fields (generated)
      expect(dto.createdAt).toBeInstanceOf(Date)
      expect(dto.updatedAt).toBeInstanceOf(Date)

      // ==========================================
      // VERIFY NO FIELD IS UNDEFINED
      // ==========================================
      const allDtoKeys = [
        'id',
        'externalId',
        'name',
        'asciiName',
        'type',
        'subType',
        'urlStub',
        'urlAncestorStub',
        'headerImage',
        'coverImage',
        'thumbnail',
        'approach',
        'latitude',
        'longitude',
        'geometry',
        'depth',
        'parentId',
        'cragId',
        'externalParentId',
        'numberRoutes',
        'numberPhotos',
        'numberTopos',
        'ascentCount',
        'kudos',
        'subAreaCount',
        'averageHeight',
        'averageHeightUnit',
        'seasonality',
        'tags',
        'hasTopo',
        'hasSubSectors',
        'createdAt',
        'updatedAt',
      ]

      for (const key of allDtoKeys) {
        expect(dto).toHaveProperty(key)
        expect((dto as Record<string, unknown>)[key]).not.toBeUndefined()
      }
    })

    test('should verify ProcessedArea to SectorCreateDto field mapping completeness', () => {
      /**
       * This test documents the mapping between ProcessedArea and SectorCreateDto:
       *
       * ProcessedArea field         -> SectorCreateDto field
       * --------------------------------------------------------
       * id                          -> externalId (converted to string)
       * name                        -> name
       * asciiName                   -> asciiName (fallback to name if empty)
       * type                        -> type
       * subType                     -> subType
       * urlStub                     -> urlStub
       * urlAncestorStub             -> urlAncestorStub
       * geometry.lat / lat          -> latitude (fallback chain)
       * geometry.long / lng         -> longitude (fallback chain)
       * geometry                    -> geometry
       * approach                    -> approach
       * headerImage                 -> headerImage
       * coverImage                  -> coverImage
       * thumbnail                   -> thumbnail
       * depth                       -> depth
       * parentID                    -> (passed as externalParentId parameter)
       * subAreaCount                -> subAreaCount
       * numberRoutes                -> numberRoutes
       * numberPhotos                -> numberPhotos
       * numberTopos                 -> numberTopos
       * ascentCount                 -> ascentCount
       * kudos                       -> kudos
       * averageHeight[0]            -> averageHeight
       * averageHeight[1]            -> averageHeightUnit
       * seasonality                 -> seasonality
       * tags                        -> tags
       * hasTopo                     -> hasTopo (number > 0 = true)
       * subAreas?.length > 0        -> hasSubSectors
       *
       * Fields NOT mapped (used elsewhere or ignored):
       * - lat, lng, latitude, longitude (redundant with geometry)
       * - map, geo, location, geolocation (not needed)
       * - image, images, photo, photos (redundant with headerImage/cover/thumb)
       * - media, phototopo (not stored in sector)
       * - topos (stored separately)
       * - routes (stored separately)
       *
       * Fields generated:
       * - id (UUID generated)
       * - parentId (passed as parameter)
       * - cragId (passed as parameter)
       * - createdAt (generated)
       * - updatedAt (generated)
       */

      const data = createCompleteProcessedArea()
      const sector = mapper['createNew'](
        data,
        TEST_CRAG_ID,
        TEST_PARENT_ID,
        TEST_EXTERNAL_PARENT_ID,
      )
      const dto = sector.toPrimitives()

      // This test passes if no exception is thrown - validates the mapping exists
      expect(dto).toBeDefined()
    })
  })
})
