import { describe, expect, test } from 'bun:test'
import { RouteInfo } from '../route-info.vo'
import { RouteHistory } from '../route-history.vo'
import { RouteBeta } from '../route-beta.vo'

describe('RouteInfo Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create RouteInfo from data-route-tick JSON
  // 2. ✓ Get bolts count
  // 3. ✓ Get display height
  // 4. ✓ Get grade context
  // 5. ✓ Get stars rating
  // 6. ✓ Get style stub
  // 7. ✓ Check if sport route
  // 8. ✓ Check if trad route

  const sampleRouteTickData = {
    bolts: 6,
    displayHeight: '12m',
    gradeContext: 'FRA',
    stars: 2,
    styleStub: 'sport',
    gradeSystems: {
      FRA: '6b',
      YDS: '5.10c',
      UIAA: 'VII-',
    },
  }

  test('should create RouteInfo from data-route-tick JSON', () => {
    // Act
    const routeInfo = RouteInfo.fromRouteTickData(sampleRouteTickData)

    // Assert
    expect(routeInfo).toBeInstanceOf(RouteInfo)
  })

  test('should get bolts count', () => {
    // Arrange
    const routeInfo = RouteInfo.fromRouteTickData(sampleRouteTickData)

    // Act & Assert
    expect(routeInfo.getBolts()).toBe(6)
  })

  test('should get display height', () => {
    // Arrange
    const routeInfo = RouteInfo.fromRouteTickData(sampleRouteTickData)

    // Act & Assert
    expect(routeInfo.getDisplayHeight()).toBe('12m')
  })

  test('should get grade context', () => {
    // Arrange
    const routeInfo = RouteInfo.fromRouteTickData(sampleRouteTickData)

    // Act & Assert
    expect(routeInfo.getGradeContext()).toBe('FRA')
  })

  test('should get stars rating', () => {
    // Arrange
    const routeInfo = RouteInfo.fromRouteTickData(sampleRouteTickData)

    // Act & Assert
    expect(routeInfo.getStars()).toBe(2)
  })

  test('should get style stub', () => {
    // Arrange
    const routeInfo = RouteInfo.fromRouteTickData(sampleRouteTickData)

    // Act & Assert
    expect(routeInfo.getStyleStub()).toBe('sport')
  })

  test('should get grade in specific system', () => {
    // Arrange
    const routeInfo = RouteInfo.fromRouteTickData(sampleRouteTickData)

    // Act & Assert
    expect(routeInfo.getGradeInSystem('FRA')).toBe('6b')
    expect(routeInfo.getGradeInSystem('YDS')).toBe('5.10c')
    expect(routeInfo.getGradeInSystem('UIAA')).toBe('VII-')
  })

  test('should check if sport route', () => {
    // Arrange
    const sportRoute = RouteInfo.fromRouteTickData(sampleRouteTickData)
    const tradRoute = RouteInfo.fromRouteTickData({
      ...sampleRouteTickData,
      styleStub: 'trad',
    })

    // Act & Assert
    expect(sportRoute.isSport()).toBe(true)
    expect(tradRoute.isSport()).toBe(false)
  })

  test('should check if trad route', () => {
    // Arrange
    const tradRoute = RouteInfo.fromRouteTickData({
      ...sampleRouteTickData,
      styleStub: 'trad',
    })
    const sportRoute = RouteInfo.fromRouteTickData(sampleRouteTickData)

    // Act & Assert
    expect(tradRoute.isTrad()).toBe(true)
    expect(sportRoute.isTrad()).toBe(false)
  })

  test('should check if boulder', () => {
    // Arrange
    const boulderRoute = RouteInfo.fromRouteTickData({
      ...sampleRouteTickData,
      styleStub: 'boulder',
    })
    const sportRoute = RouteInfo.fromRouteTickData(sampleRouteTickData)

    // Act & Assert
    expect(boulderRoute.isBoulder()).toBe(true)
    expect(sportRoute.isBoulder()).toBe(false)
  })

  test('should get height as number', () => {
    // Arrange
    const routeInfo = RouteInfo.fromRouteTickData(sampleRouteTickData)

    // Act
    const heightNumber = routeInfo.getHeightInMeters()

    // Assert
    expect(heightNumber).toBe(12)
  })
})

describe('RouteHistory Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create RouteHistory with FA info
  // 2. ✓ Get FA type (Set/FA/FFA)
  // 3. ✓ Get climber name
  // 4. ✓ Get date
  // 5. ✓ Parse from HTML route-history element

  test('should create RouteHistory with FA info', () => {
    // Act
    const history = RouteHistory.create('FA', 'John Smith', '2020-05-15')

    // Assert
    expect(history).toBeInstanceOf(RouteHistory)
  })

  test('should get FA type', () => {
    // Arrange
    const history = RouteHistory.create('FFA', 'Jane Doe', '2019-10-20')

    // Act & Assert
    expect(history.getFaType()).toBe('FFA')
  })

  test('should get climber name', () => {
    // Arrange
    const history = RouteHistory.create('FA', 'Carlos García', '2021-03-10')

    // Act & Assert
    expect(history.getClimber()).toBe('Carlos García')
  })

  test('should get date', () => {
    // Arrange
    const history = RouteHistory.create('Set', 'Route Setter', '2022-01-01')

    // Act & Assert
    expect(history.getDate()).toBe('2022-01-01')
  })

  test('should check if first ascent', () => {
    // Arrange
    const faHistory = RouteHistory.create('FA', 'Climber', '2020-01-01')
    const setHistory = RouteHistory.create('Set', 'Setter', '2020-01-01')

    // Act & Assert
    expect(faHistory.isFirstAscent()).toBe(true)
    expect(setHistory.isFirstAscent()).toBe(false)
  })

  test('should check if first free ascent', () => {
    // Arrange
    const ffaHistory = RouteHistory.create('FFA', 'Climber', '2020-01-01')
    const faHistory = RouteHistory.create('FA', 'Climber', '2020-01-01')

    // Act & Assert
    expect(ffaHistory.isFirstFreeAscent()).toBe(true)
    expect(faHistory.isFirstFreeAscent()).toBe(false)
  })

  test('should get year', () => {
    // Arrange
    const history = RouteHistory.create('FA', 'Climber', '2020-05-15')

    // Act & Assert
    expect(history.getYear()).toBe(2020)
  })
})

describe('RouteBeta Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create RouteBeta with description and approach
  // 2. ✓ Get description
  // 3. ✓ Get approach
  // 4. ✓ Get unique features
  // 5. ✓ Check if has description

  test('should create RouteBeta with description and approach', () => {
    // Act
    const beta = RouteBeta.create(
      'Technical crimpy route with a crux at the top.',
      'Follow the main trail for 5 minutes.',
      'Beautiful moves on perfect limestone.',
    )

    // Assert
    expect(beta).toBeInstanceOf(RouteBeta)
  })

  test('should get description', () => {
    // Arrange
    const beta = RouteBeta.create(
      'Start on the left side and traverse right.',
      null,
      null,
    )

    // Act & Assert
    expect(beta.getDescription()).toBe(
      'Start on the left side and traverse right.',
    )
  })

  test('should get approach', () => {
    // Arrange
    const beta = RouteBeta.create(
      'Main route description.',
      'Park at the main parking and walk 10 minutes.',
      null,
    )

    // Act & Assert
    expect(beta.getApproach()).toBe(
      'Park at the main parking and walk 10 minutes.',
    )
  })

  test('should get unique features', () => {
    // Arrange
    const beta = RouteBeta.create(
      'Route description.',
      null,
      'Amazing tufa climbing on overhanging wall.',
    )

    // Act & Assert
    expect(beta.getUniqueFeatures()).toBe(
      'Amazing tufa climbing on overhanging wall.',
    )
  })

  test('should check if has description', () => {
    // Arrange
    const betaWithDesc = RouteBeta.create('Some description', null, null)
    const betaWithoutDesc = RouteBeta.create(null, 'Some approach', null)

    // Act & Assert
    expect(betaWithDesc.hasDescription()).toBe(true)
    expect(betaWithoutDesc.hasDescription()).toBe(false)
  })

  test('should check if has approach', () => {
    // Arrange
    const betaWithApproach = RouteBeta.create(null, 'Walk 5 minutes', null)
    const betaWithoutApproach = RouteBeta.create('Description', null, null)

    // Act & Assert
    expect(betaWithApproach.hasApproach()).toBe(true)
    expect(betaWithoutApproach.hasApproach()).toBe(false)
  })

  test('should get full beta text', () => {
    // Arrange
    const beta = RouteBeta.create(
      'Main description.',
      'Approach info.',
      'Special features.',
    )

    // Act
    const fullText = beta.getFullBetaText()

    // Assert
    expect(fullText).toContain('Main description.')
    expect(fullText).toContain('Approach info.')
    expect(fullText).toContain('Special features.')
  })
})
