import { describe, expect, test } from 'bun:test'
import { NodeId } from '../../value-objects/node-id.vo'
import { RawHtmlResponse } from '../../value-objects/raw-html-response.vo'
import { RawNodeResponse } from '../../value-objects/raw-node-response.vo'
import { RouteBeta } from '../../value-objects/route-beta.vo'
import { RouteGrade } from '../../value-objects/route-grade.vo'
import { RouteHistory } from '../../value-objects/route-history.vo'
import { RouteInfo } from '../../value-objects/route-info.vo'
import { ScrapedRoute } from '../scraped-route.entity'

describe('ScrapedRoute Entity', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create ScrapedRoute with minimal data
  // 2. ✓ Get basic properties (id, name, slug, url)
  // 3. ✓ Get grade
  // 4. ✓ Get route info (bolts, height, style)
  // 5. ✓ Get route history (FA)
  // 6. ✓ Get route beta (description)
  // 7. ✓ Get parent area ID
  // 8. ✓ Get raw responses
  // 9. ✓ Convenience getters (isSport, getBolts, getHeight)
  // 10. ✓ Get grade color
  // 11. ✓ Create ScrapedRoute from API route data (fromApiRouteData)
  // 12. ✓ fromApiRouteData with null grade
  // 13. ✓ fromApiRouteData with parent area ID
  // 14. ✓ fromApiRouteData parse first ascent string
  // 15. ✓ fromApiRouteData handle first ascent with only year
  // 16. ✓ fromApiRouteData generate slug from name

  const sampleRouteId = NodeId.createFrom('1447609059')
  const sampleParentId = NodeId.createFrom('17857049')
  const sampleGrade = RouteGrade.create('6b', 'gb3')
  const sampleRouteInfo = RouteInfo.fromRouteTickData({
    bolts: 8,
    displayHeight: '15m',
    gradeContext: 'FRA',
    stars: 3,
    styleStub: 'sport',
    gradeSystems: { FRA: '6b', YDS: '5.10c' },
  })
  const sampleHistory = RouteHistory.create('FA', 'John Smith', '2020-05-15')
  const sampleBeta = RouteBeta.create(
    'Technical crimpy route with a powerful crux at the top.',
    'Follow the main trail for 5 minutes.',
    'Beautiful tufa climbing.',
  )
  const sampleRawNode = RawNodeResponse.fromApiResponse({
    id: 1447609059,
    name: 'Sargantana',
  })
  const sampleRawHtml = RawHtmlResponse.create(
    '<html><body>Route page</body></html>',
    'https://www.thecrag.com/route/1447609059',
  )

  test('should create ScrapedRoute with minimal data', () => {
    // Act
    const route = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    )

    // Assert
    expect(route).toBeInstanceOf(ScrapedRoute)
  })

  test('should get basic properties', () => {
    // Arrange
    const route = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    )

    // Act & Assert
    expect(route.getId().toString()).toBe('1447609059')
    expect(route.getName()).toBe('Sargantana')
    expect(route.getSlug()).toBe('sargantana')
    expect(route.getUrl()).toBe('/route/1447609059')
  })

  test('should get grade', () => {
    // Arrange
    const route = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      sampleGrade,
      null,
      null,
      null,
      null,
      null,
      null,
    )

    // Act
    const grade = route.getGrade()

    // Assert
    expect(grade).not.toBeNull()
    expect(grade?.getGrade()).toBe('6b')
    expect(grade?.getGradeClass()).toBe('gb3')
  })

  test('should get route info', () => {
    // Arrange
    const route = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      null,
      sampleRouteInfo,
      null,
      null,
      null,
      null,
      null,
    )

    // Act
    const info = route.getRouteInfo()

    // Assert
    expect(info).not.toBeNull()
    expect(info?.getBolts()).toBe(8)
    expect(info?.getDisplayHeight()).toBe('15m')
    expect(info?.getStyleStub()).toBe('sport')
  })

  test('should get route history', () => {
    // Arrange
    const route = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      null,
      null,
      sampleHistory,
      null,
      null,
      null,
      null,
    )

    // Act
    const history = route.getHistory()

    // Assert
    expect(history).not.toBeNull()
    expect(history?.getClimber()).toBe('John Smith')
    expect(history?.getYear()).toBe(2020)
  })

  test('should get route beta', () => {
    // Arrange
    const route = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      null,
      null,
      null,
      sampleBeta,
      null,
      null,
      null,
    )

    // Act
    const beta = route.getBeta()

    // Assert
    expect(beta).not.toBeNull()
    expect(beta?.hasDescription()).toBe(true)
    expect(beta?.getDescription()).toContain('crimpy route')
  })

  test('should get parent area ID', () => {
    // Arrange
    const route = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      null,
      null,
      null,
      null,
      sampleParentId,
      null,
      null,
    )

    // Act
    const parentId = route.getParentAreaId()

    // Assert
    expect(parentId).not.toBeNull()
    expect(parentId?.toString()).toBe('17857049')
  })

  test('should get raw responses', () => {
    // Arrange
    const route = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      null,
      null,
      null,
      null,
      null,
      sampleRawNode,
      sampleRawHtml,
    )

    // Act
    const rawNode = route.getRawNodeResponse()
    const rawHtml = route.getRawHtmlResponse()

    // Assert
    expect(rawNode).not.toBeNull()
    expect(rawNode?.getNodeName()).toBe('Sargantana')
    expect(rawHtml).not.toBeNull()
    expect(rawHtml?.getUrl()).toContain('1447609059')
  })

  test('should have convenience getters', () => {
    // Arrange
    const route = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      sampleGrade,
      sampleRouteInfo,
      null,
      null,
      null,
      null,
      null,
    )

    // Act & Assert
    expect(route.isSport()).toBe(true)
    expect(route.isTrad()).toBe(false)
    expect(route.isBoulder()).toBe(false)
    expect(route.getBolts()).toBe(8)
    expect(route.getHeight()).toBe('15m')
    expect(route.getStars()).toBe(3)
  })

  test('should get grade color', () => {
    // Arrange
    const route = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      sampleGrade,
      null,
      null,
      null,
      null,
      null,
      null,
    )

    // Act
    const color = route.getGradeColor()

    // Assert
    expect(color).toBe('#FFC107') // gb3 = Yellow/Amber
  })

  test('should return default color when no grade', () => {
    // Arrange
    const route = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    )

    // Act
    const color = route.getGradeColor()

    // Assert
    expect(color).toBe('#808080') // Default gray
  })

  test('should check if has beta', () => {
    // Arrange
    const routeWithBeta = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      null,
      null,
      null,
      sampleBeta,
      null,
      null,
      null,
    )
    const routeWithoutBeta = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    )

    // Act & Assert
    expect(routeWithBeta.hasBeta()).toBe(true)
    expect(routeWithoutBeta.hasBeta()).toBe(false)
  })

  test('should get FA info', () => {
    // Arrange
    const route = ScrapedRoute.create(
      sampleRouteId,
      'Sargantana',
      'sargantana',
      '/route/1447609059',
      null,
      null,
      sampleHistory,
      null,
      null,
      null,
      null,
    )

    // Act
    const faClimber = route.getFirstAscentClimber()
    const faYear = route.getFirstAscentYear()

    // Assert
    expect(faClimber).toBe('John Smith')
    expect(faYear).toBe(2020)
  })

  describe('fromApiRouteData', () => {
    test('should create ScrapedRoute from API route data with all fields', () => {
      // Arrange
      const apiData = {
        id: 1447609059,
        name: 'Sargantana',
        grade: '6b',
        gradeIndex: 18,
        height: 15,
        pitches: 1,
        quality: 85,
        stars: 3,
        ascents: 42,
        subType: 'sport',
        bolts: 8,
        firstAscent: 'John Smith, 2020',
        tags: ['crimpy', 'technical'],
        warnings: null,
      }

      // Act
      const route = ScrapedRoute.fromApiRouteData(apiData)

      // Assert
      expect(route).toBeInstanceOf(ScrapedRoute)
      expect(route.getId().toString()).toBe('1447609059')
      expect(route.getName()).toBe('Sargantana')
      expect(route.getSlug()).toBe('sargantana')
      expect(route.getGradeString()).toBe('6b')
      expect(route.getHeight()).toBe('15m')
      expect(route.getBolts()).toBe(8)
      expect(route.getStars()).toBe(3)
      expect(route.isSport()).toBe(true)
    })

    test('should create ScrapedRoute from API route data with null grade', () => {
      // Arrange
      const apiData = {
        id: 1447609060,
        name: 'Unknown Route',
        grade: null,
        gradeIndex: null,
        height: null,
        pitches: null,
        quality: null,
        stars: null,
        ascents: null,
        subType: null,
        bolts: null,
        firstAscent: null,
        tags: null,
        warnings: null,
      }

      // Act
      const route = ScrapedRoute.fromApiRouteData(apiData)

      // Assert
      expect(route).toBeInstanceOf(ScrapedRoute)
      expect(route.getId().toString()).toBe('1447609060')
      expect(route.getName()).toBe('Unknown Route')
      expect(route.getGrade()).toBeNull()
      expect(route.getHeight()).toBeNull()
      expect(route.getBolts()).toBeNull()
      expect(route.getStars()).toBeNull()
    })

    test('should create ScrapedRoute from API route data with parent area ID', () => {
      // Arrange
      const apiData = {
        id: 1447609061,
        name: 'Child Route',
        grade: '7a',
        gradeIndex: 20,
        height: 20,
        pitches: 2,
        quality: 90,
        stars: 4,
        ascents: 100,
        subType: 'trad',
        bolts: null,
        firstAscent: 'Jane Doe, 1995',
        tags: ['classic'],
        warnings: ['loose rock'],
      }
      const parentAreaId = NodeId.createFrom('17857049')

      // Act
      const route = ScrapedRoute.fromApiRouteData(apiData, parentAreaId)

      // Assert
      expect(route).toBeInstanceOf(ScrapedRoute)
      expect(route.getParentAreaId()?.toString()).toBe('17857049')
      expect(route.isTrad()).toBe(true)
      expect(route.getRouteInfo()?.getPitches()).toBe(2)
      expect(route.getRouteInfo()?.getAscentCount()).toBe(100)
    })

    test('should parse first ascent string into history', () => {
      // Arrange
      const apiData = {
        id: 1447609062,
        name: 'Historic Route',
        grade: '5c',
        gradeIndex: 15,
        height: 12,
        pitches: 1,
        quality: 70,
        stars: 2,
        ascents: 50,
        subType: 'sport',
        bolts: 6,
        firstAscent: 'Alex Honnold, 2010',
        tags: null,
        warnings: null,
      }

      // Act
      const route = ScrapedRoute.fromApiRouteData(apiData)

      // Assert
      expect(route.getFirstAscentClimber()).toBe('Alex Honnold')
      expect(route.getFirstAscentYear()).toBe(2010)
    })

    test('should handle first ascent with only year', () => {
      // Arrange
      const apiData = {
        id: 1447609063,
        name: 'Old Route',
        grade: '4a',
        gradeIndex: 10,
        height: 10,
        pitches: 1,
        quality: 60,
        stars: 1,
        ascents: 20,
        subType: 'sport',
        bolts: 4,
        firstAscent: '1985',
        tags: null,
        warnings: null,
      }

      // Act
      const route = ScrapedRoute.fromApiRouteData(apiData)

      // Assert
      expect(route.getFirstAscentYear()).toBe(1985)
    })

    test('should generate slug from route name', () => {
      // Arrange
      const apiData = {
        id: 1447609064,
        name: 'The Great Route (Direct)',
        grade: '6a+',
        gradeIndex: 16,
        height: 18,
        pitches: 1,
        quality: 80,
        stars: 3,
        ascents: 30,
        subType: 'sport',
        bolts: 7,
        firstAscent: null,
        tags: null,
        warnings: null,
      }

      // Act
      const route = ScrapedRoute.fromApiRouteData(apiData)

      // Assert
      expect(route.getSlug()).toBe('the-great-route-direct')
    })
  })
})
