import { describe, expect, test } from 'bun:test'
import { NodeStatistics } from '../node-statistics.vo'
import { NodeSeasonality } from '../node-seasonality.vo'
import { NodeTags } from '../node-tags.vo'
import { NodeMetadata } from '../node-metadata.vo'

describe('NodeStatistics Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create NodeStatistics with all counts
  // 2. ✓ Get routes count
  // 3. ✓ Get ascents count
  // 4. ✓ Get photos count
  // 5. ✓ Get favorites count
  // 6. ✓ Get kudos count

  test('should create NodeStatistics with all counts', () => {
    // Act
    const stats = NodeStatistics.create(42, 979, 6, 32, 1502)

    // Assert
    expect(stats).toBeInstanceOf(NodeStatistics)
  })

  test('should get routes count', () => {
    // Arrange
    const stats = NodeStatistics.create(42, 979, 6, 32, 1502)

    // Act & Assert
    expect(stats.getRoutes()).toBe(42)
  })

  test('should get ascents count', () => {
    // Arrange
    const stats = NodeStatistics.create(42, 979, 6, 32, 1502)

    // Act & Assert
    expect(stats.getAscents()).toBe(979)
  })

  test('should get photos count', () => {
    // Arrange
    const stats = NodeStatistics.create(42, 979, 6, 32, 1502)

    // Act & Assert
    expect(stats.getPhotos()).toBe(6)
  })

  test('should get favorites count', () => {
    // Arrange
    const stats = NodeStatistics.create(42, 979, 6, 32, 1502)

    // Act & Assert
    expect(stats.getFavorites()).toBe(32)
  })

  test('should get kudos count', () => {
    // Arrange
    const stats = NodeStatistics.create(42, 979, 6, 32, 1502)

    // Act & Assert
    expect(stats.getKudos()).toBe(1502)
  })

  test('should calculate popularity score', () => {
    // Arrange
    const stats = NodeStatistics.create(42, 979, 6, 32, 1502)

    // Act
    const score = stats.getPopularityScore()

    // Assert - score should be a positive number based on combined metrics
    expect(score).toBeGreaterThan(0)
  })
})

describe('NodeSeasonality Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create NodeSeasonality with monthly scores
  // 2. ✓ Get monthly scores array
  // 3. ✓ Get best months
  // 4. ✓ Get worst months
  // 5. ✓ Get score for specific month

  const monthlyScores = [113, 67, 47, 110, 83, 82, 26, 8, 67, 138, 111, 123]

  test('should create NodeSeasonality with monthly scores', () => {
    // Act
    const seasonality = NodeSeasonality.create(monthlyScores)

    // Assert
    expect(seasonality).toBeInstanceOf(NodeSeasonality)
  })

  test('should get monthly scores array', () => {
    // Arrange
    const seasonality = NodeSeasonality.create(monthlyScores)

    // Act
    const scores = seasonality.getMonthlyScores()

    // Assert
    expect(scores).toEqual(monthlyScores)
  })

  test('should get best months', () => {
    // Arrange
    const seasonality = NodeSeasonality.create(monthlyScores)

    // Act
    const bestMonths = seasonality.getBestMonths()

    // Assert - October (index 9) has highest score (138), followed by December (123), January (113)
    expect(bestMonths).toContain('October')
    expect(bestMonths.length).toBeGreaterThanOrEqual(1)
  })

  test('should get worst months', () => {
    // Arrange
    const seasonality = NodeSeasonality.create(monthlyScores)

    // Act
    const worstMonths = seasonality.getWorstMonths()

    // Assert - August (index 7) has lowest score (8)
    expect(worstMonths).toContain('August')
    expect(worstMonths.length).toBeGreaterThanOrEqual(1)
  })

  test('should get score for specific month by index', () => {
    // Arrange
    const seasonality = NodeSeasonality.create(monthlyScores)

    // Act
    const januaryScore = seasonality.getScoreForMonth(0)
    const augustScore = seasonality.getScoreForMonth(7)

    // Assert
    expect(januaryScore).toBe(113)
    expect(augustScore).toBe(8)
  })

  test('should get score for specific month by name', () => {
    // Arrange
    const seasonality = NodeSeasonality.create(monthlyScores)

    // Act
    const octoberScore = seasonality.getScoreForMonthName('October')

    // Assert
    expect(octoberScore).toBe(138)
  })

  test('should check if month is recommended', () => {
    // Arrange
    const seasonality = NodeSeasonality.create(monthlyScores)

    // Act & Assert
    expect(seasonality.isRecommendedMonth(9)).toBe(true) // October
    expect(seasonality.isRecommendedMonth(7)).toBe(false) // August
  })
})

describe('NodeTags Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create NodeTags from API tags structure
  // 2. ✓ Get aspect
  // 3. ✓ Get amenities list
  // 4. ✓ Get crowds list
  // 5. ✓ Get family-friendly tags
  // 6. ✓ Get walk-in time
  // 7. ✓ Get weather tags

  const sampleTags = {
    Amenities: {
      'No camping': { hasIcon: 1, id: 198053131, name: 'No camping' },
      'No fires': { hasIcon: 1, id: 198053137, name: 'No fires' },
    },
    Aspect: {
      SW: { id: 198052867, name: 'SW' },
    },
    Crowds: {
      Beginners: { id: 198053161, name: 'Beginners' },
      Crowded: { id: 198053173, name: 'Crowded' },
    },
    Family: {
      'Dog friendly': { hasIcon: 1, id: 198053149, name: 'Dog friendly' },
      'Kid friendly': { hasIcon: 1, id: 198053143, name: 'Kid friendly' },
    },
    'Walk in time': {
      '<5 min': { id: 198053221, name: '<5 min' },
    },
    Weather: {
      'Afternoon sun': { hasIcon: 1, id: 198053047, name: 'Afternoon sun' },
      'Noon sun': { hasIcon: 1, id: 2274065277, name: 'Noon sun' },
    },
  }

  test('should create NodeTags from API tags structure', () => {
    // Act
    const tags = NodeTags.fromApiTags(sampleTags)

    // Assert
    expect(tags).toBeInstanceOf(NodeTags)
  })

  test('should get aspect', () => {
    // Arrange
    const tags = NodeTags.fromApiTags(sampleTags)

    // Act & Assert
    expect(tags.getAspect()).toBe('SW')
  })

  test('should get amenities list', () => {
    // Arrange
    const tags = NodeTags.fromApiTags(sampleTags)

    // Act
    const amenities = tags.getAmenities()

    // Assert
    expect(amenities).toContain('No camping')
    expect(amenities).toContain('No fires')
  })

  test('should get crowds list', () => {
    // Arrange
    const tags = NodeTags.fromApiTags(sampleTags)

    // Act
    const crowds = tags.getCrowds()

    // Assert
    expect(crowds).toContain('Beginners')
    expect(crowds).toContain('Crowded')
  })

  test('should get family-friendly tags', () => {
    // Arrange
    const tags = NodeTags.fromApiTags(sampleTags)

    // Act
    const family = tags.getFamily()

    // Assert
    expect(family).toContain('Dog friendly')
    expect(family).toContain('Kid friendly')
  })

  test('should get walk-in time', () => {
    // Arrange
    const tags = NodeTags.fromApiTags(sampleTags)

    // Act & Assert
    expect(tags.getWalkInTime()).toBe('<5 min')
  })

  test('should get weather tags', () => {
    // Arrange
    const tags = NodeTags.fromApiTags(sampleTags)

    // Act
    const weather = tags.getWeather()

    // Assert
    expect(weather).toContain('Afternoon sun')
    expect(weather).toContain('Noon sun')
  })

  test('should check if kid friendly', () => {
    // Arrange
    const tags = NodeTags.fromApiTags(sampleTags)

    // Act & Assert
    expect(tags.isKidFriendly()).toBe(true)
  })

  test('should check if dog friendly', () => {
    // Arrange
    const tags = NodeTags.fromApiTags(sampleTags)

    // Act & Assert
    expect(tags.isDogFriendly()).toBe(true)
  })

  test('should check if beginner friendly', () => {
    // Arrange
    const tags = NodeTags.fromApiTags(sampleTags)

    // Act & Assert
    expect(tags.isBeginnerFriendly()).toBe(true)
  })
})

describe('NodeMetadata Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create NodeMetadata with all fields
  // 2. ✓ Get depth
  // 3. ✓ Get sibling label
  // 4. ✓ Get price category
  // 5. ✓ Check if top level crag (isTLC)
  // 6. ✓ Get locatedness
  // 7. ✓ Get max popularity

  test('should create NodeMetadata with all fields', () => {
    // Act
    const metadata = NodeMetadata.create(5, 17, 'Emerging', true, 80, 50)

    // Assert
    expect(metadata).toBeInstanceOf(NodeMetadata)
  })

  test('should get depth', () => {
    // Arrange
    const metadata = NodeMetadata.create(5, 17, 'Emerging', true, 80, 50)

    // Act & Assert
    expect(metadata.getDepth()).toBe(5)
  })

  test('should get sibling label', () => {
    // Arrange
    const metadata = NodeMetadata.create(5, 17, 'Emerging', true, 80, 50)

    // Act & Assert
    expect(metadata.getSiblingLabel()).toBe(17)
  })

  test('should get price category', () => {
    // Arrange
    const metadata = NodeMetadata.create(5, 17, 'Emerging', true, 80, 50)

    // Act & Assert
    expect(metadata.getPriceCategory()).toBe('Emerging')
  })

  test('should check if top level crag', () => {
    // Arrange
    const metadataTLC = NodeMetadata.create(5, 17, 'Emerging', true, 80, 50)
    const metadataNotTLC = NodeMetadata.create(5, 17, 'Emerging', false, 80, 50)

    // Act & Assert
    expect(metadataTLC.isTLC()).toBe(true)
    expect(metadataNotTLC.isTLC()).toBe(false)
  })

  test('should get locatedness', () => {
    // Arrange
    const metadata = NodeMetadata.create(5, 17, 'Emerging', true, 80, 50)

    // Act & Assert
    expect(metadata.getLocatedness()).toBe(80)
  })

  test('should get max popularity', () => {
    // Arrange
    const metadata = NodeMetadata.create(5, 17, 'Emerging', true, 80, 50)

    // Act & Assert
    expect(metadata.getMaxPop()).toBe(50)
  })

  test('should check if premium category', () => {
    // Arrange
    const premiumMetadata = NodeMetadata.create(5, 17, 'Premium', true, 80, 50)
    const emergingMetadata = NodeMetadata.create(
      5,
      17,
      'Emerging',
      true,
      80,
      50,
    )

    // Act & Assert
    expect(premiumMetadata.isPremium()).toBe(true)
    expect(emergingMetadata.isPremium()).toBe(false)
  })
})
