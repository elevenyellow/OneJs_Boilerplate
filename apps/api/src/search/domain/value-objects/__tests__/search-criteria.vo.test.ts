import { describe, expect, test } from 'bun:test'
import { Coordinates } from '@crags/domain/value-objects'
import { SeasonPreference } from '../../types/seasonality.types'
import { GradeRange } from '../grade-range.vo'
import { SearchCriteria } from '../search-criteria.vo'
import { SearchLimit } from '../search-limit.vo'
import { SearchRadius } from '../search-radius.vo'

describe('SearchCriteria Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create search criteria with valid coordinates, radius VO, grade range, season
  // 2. ✓ Throw error when SearchRadius.create receives radius <= 0
  // 3. ✓ Throw error when SearchRadius.create receives radius > 200km
  // 4. ✓ Get coordinates
  // 5. ✓ Get radius VO and radius in km
  // 6. ✓ Get grade range
  // 7. ✓ Get season preference
  // 8. ✓ Default season preference to ANY when not provided
  // 9. ✓ Get limit (default 20)
  // 10. ✓ Throw error when limit < 1
  // 11. ✓ Throw error when limit > 100
  // 12. ✓ Calculate bounding box from radius and coordinates

  test('should create search criteria with valid parameters', () => {
    const coords = Coordinates.createFrom(41.7, 1.8)
    const radius = SearchRadius.create(50)
    const gradeRange = GradeRange.create(24, 30)
    const limit = SearchLimit.create(20)

    const criteria = SearchCriteria.create(
      coords,
      radius,
      gradeRange,
      SeasonPreference.SUMMER,
      limit,
    )

    expect(criteria.getCoordinates()).toBe(coords)
    expect(criteria.getRadius()).toBe(radius)
    expect(criteria.getRadiusKm()).toBe(50)
    expect(criteria.getGradeRange()).toBe(gradeRange)
    expect(criteria.getSeasonPreference()).toBe(SeasonPreference.SUMMER)
    expect(criteria.getLimit().getValue()).toBe(20)
  })

  test('should throw error when radius <= 0', () => {
    expect(() => SearchRadius.create(0)).toThrow('Invalid radius')
    expect(() => SearchRadius.create(-10)).toThrow('Invalid radius')
  })

  test('should throw error when radius > 200km', () => {
    expect(() => SearchRadius.create(201)).toThrow('Invalid radius')
  })

  test('should default season preference to ANY when not provided', () => {
    const coords = Coordinates.createFrom(41.7, 1.8)
    const radius = SearchRadius.create(50)
    const gradeRange = GradeRange.create(24, 30)

    const criteria = SearchCriteria.create(coords, radius, gradeRange)

    expect(criteria.getSeasonPreference()).toBe(SeasonPreference.ANY)
  })

  test('should default limit to 20 when not provided', () => {
    const coords = Coordinates.createFrom(41.7, 1.8)
    const radius = SearchRadius.create(50)
    const gradeRange = GradeRange.create(24, 30)

    const criteria = SearchCriteria.create(coords, radius, gradeRange)

    expect(criteria.getLimit().getValue()).toBe(20)
  })

  test('should throw error when limit < 1', () => {
    expect(() => SearchLimit.create(0)).toThrow('Invalid limit')
  })

  test('should throw error when limit > 100', () => {
    expect(() => SearchLimit.create(101)).toThrow('Invalid limit')
  })

  test('should accept valid limit of 1', () => {
    const coords = Coordinates.createFrom(41.7, 1.8)
    const radius = SearchRadius.create(50)
    const gradeRange = GradeRange.create(24, 30)
    const limit = SearchLimit.create(1)

    const criteria = SearchCriteria.create(
      coords,
      radius,
      gradeRange,
      SeasonPreference.SUMMER,
      limit,
    )

    expect(criteria.getLimit().getValue()).toBe(1)
  })

  test('should accept valid limit of 100', () => {
    const coords = Coordinates.createFrom(41.7, 1.8)
    const radius = SearchRadius.create(50)
    const gradeRange = GradeRange.create(24, 30)
    const limit = SearchLimit.create(100)

    const criteria = SearchCriteria.create(
      coords,
      radius,
      gradeRange,
      SeasonPreference.SUMMER,
      limit,
    )

    expect(criteria.getLimit().getValue()).toBe(100)
  })

  test('should calculate bounding box correctly', () => {
    const coords = Coordinates.createFrom(41.7, 1.8)
    const radius = SearchRadius.create(50)
    const gradeRange = GradeRange.create(24, 30)

    const criteria = SearchCriteria.create(coords, radius, gradeRange)
    const boundingBox = criteria.getBoundingBox()

    expect(boundingBox).toBeDefined()
    expect(boundingBox.getMinLatitude()).toBeLessThan(41.7)
    expect(boundingBox.getMaxLatitude()).toBeGreaterThan(41.7)
    expect(boundingBox.getMinLongitude()).toBeLessThan(1.8)
    expect(boundingBox.getMaxLongitude()).toBeGreaterThan(1.8)
  })
})
