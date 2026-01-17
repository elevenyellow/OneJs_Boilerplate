import { describe, expect, test } from 'bun:test'
import {
  parseGradeSystem,
  parseSeasonPreference,
  parseExposurePreference,
  parseDistanceUnit,
  parseRadiusToKm,
  parseGradeIndex,
  parseOptionalGradeIndex,
  parseNumber,
  parseRequiredNumber,
  parseLatitude,
  parseLongitude,
} from '../query-parser'

// ============================================================================
// TEST CASES
// ============================================================================
// parseGradeSystem:
// 1. ✓ Returns french for code 1
// 2. ✓ Returns yds for code 2
// 3. ✓ Returns default for undefined
// 4. ✓ Backward compatible with string values
// 5. ✓ Returns default for invalid code
//
// parseSeasonPreference:
// 6. ✓ Returns any for code 0
// 7. ✓ Returns summer for code 1
// 8. ✓ Returns winter for code 2
// 9. ✓ Backward compatible with string values
//
// parseExposurePreference:
// 10. ✓ Returns any for code 0
// 11. ✓ Returns sun for code 1
// 12. ✓ Returns shade for code 2
//
// parseDistanceUnit:
// 13. ✓ Returns km for code 1
// 14. ✓ Returns mi for code 2
// 15. ✓ Backward compatible with string values
//
// parseRadiusToKm:
// 16. ✓ Returns value as-is for km
// 17. ✓ Converts miles to km
// 18. ✓ Uses default radius when undefined
//
// parseGradeIndex:
// 19. ✓ Returns valid grade index
// 20. ✓ Throws for undefined
// 21. ✓ Throws for non-numeric
// 22. ✓ Throws for out of range
//
// parseLatitude/parseLongitude:
// 23. ✓ Parses valid coordinates
// 24. ✓ Throws for out of range
// ============================================================================

describe('parseGradeSystem', () => {
  test('should return french for code 1', () => {
    expect(parseGradeSystem(1)).toBe('french')
    expect(parseGradeSystem('1')).toBe('french')
  })

  test('should return yds for code 2', () => {
    expect(parseGradeSystem(2)).toBe('yds')
    expect(parseGradeSystem('2')).toBe('yds')
  })

  test('should return all grade systems for their codes', () => {
    expect(parseGradeSystem(1)).toBe('french')
    expect(parseGradeSystem(2)).toBe('yds')
    expect(parseGradeSystem(3)).toBe('uiaa')
    expect(parseGradeSystem(4)).toBe('british')
    expect(parseGradeSystem(5)).toBe('font')
    expect(parseGradeSystem(6)).toBe('hueco')
  })

  test('should return default for undefined', () => {
    expect(parseGradeSystem(undefined)).toBe('french')
    expect(parseGradeSystem(undefined, 'yds')).toBe('yds')
  })

  test('should be backward compatible with string values', () => {
    expect(parseGradeSystem('french')).toBe('french')
    expect(parseGradeSystem('yds')).toBe('yds')
    expect(parseGradeSystem('FRENCH')).toBe('french')
  })

  test('should return default for invalid code', () => {
    expect(parseGradeSystem(99)).toBe('french')
    expect(parseGradeSystem('invalid')).toBe('french')
  })
})

describe('parseSeasonPreference', () => {
  test('should return any for code 0', () => {
    expect(parseSeasonPreference(0)).toBe('any')
    expect(parseSeasonPreference('0')).toBe('any')
  })

  test('should return summer for code 1', () => {
    expect(parseSeasonPreference(1)).toBe('summer')
    expect(parseSeasonPreference('1')).toBe('summer')
  })

  test('should return winter for code 2', () => {
    expect(parseSeasonPreference(2)).toBe('winter')
    expect(parseSeasonPreference('2')).toBe('winter')
  })

  test('should be backward compatible with string values', () => {
    expect(parseSeasonPreference('any')).toBe('any')
    expect(parseSeasonPreference('summer')).toBe('summer')
    expect(parseSeasonPreference('winter')).toBe('winter')
  })

  test('should return default for undefined', () => {
    expect(parseSeasonPreference(undefined)).toBe('any')
  })
})

describe('parseExposurePreference', () => {
  test('should return any for code 0', () => {
    expect(parseExposurePreference(0)).toBe('any')
    expect(parseExposurePreference('0')).toBe('any')
  })

  test('should return sun for code 1', () => {
    expect(parseExposurePreference(1)).toBe('sun')
    expect(parseExposurePreference('1')).toBe('sun')
  })

  test('should return shade for code 2', () => {
    expect(parseExposurePreference(2)).toBe('shade')
    expect(parseExposurePreference('2')).toBe('shade')
  })

  test('should be backward compatible with string values', () => {
    expect(parseExposurePreference('sun')).toBe('sun')
    expect(parseExposurePreference('shade')).toBe('shade')
  })
})

describe('parseDistanceUnit', () => {
  test('should return km for code 1', () => {
    expect(parseDistanceUnit(1)).toBe('km')
    expect(parseDistanceUnit('1')).toBe('km')
  })

  test('should return mi for code 2', () => {
    expect(parseDistanceUnit(2)).toBe('mi')
    expect(parseDistanceUnit('2')).toBe('mi')
  })

  test('should be backward compatible with string values', () => {
    expect(parseDistanceUnit('km')).toBe('km')
    expect(parseDistanceUnit('kilometers')).toBe('km')
    expect(parseDistanceUnit('mi')).toBe('mi')
    expect(parseDistanceUnit('miles')).toBe('mi')
  })

  test('should return default for undefined', () => {
    expect(parseDistanceUnit(undefined)).toBe('km')
  })
})

describe('parseRadiusToKm', () => {
  test('should return value as-is for km', () => {
    expect(parseRadiusToKm(50, 1)).toBe(50)
    expect(parseRadiusToKm('50', '1')).toBe(50)
    expect(parseRadiusToKm(50, 'km')).toBe(50)
  })

  test('should convert miles to km', () => {
    const milesValue = 30
    const expectedKm = milesValue * 1.60934
    expect(parseRadiusToKm(milesValue, 2)).toBeCloseTo(expectedKm, 2)
    expect(parseRadiusToKm('30', '2')).toBeCloseTo(expectedKm, 2)
    expect(parseRadiusToKm(30, 'mi')).toBeCloseTo(expectedKm, 2)
  })

  test('should use default radius when undefined', () => {
    expect(parseRadiusToKm(undefined, 1)).toBe(50)
  })
})

describe('parseGradeIndex', () => {
  test('should return valid grade index', () => {
    expect(parseGradeIndex(24, 'gmin')).toBe(24)
    expect(parseGradeIndex('32', 'gmax')).toBe(32)
    expect(parseGradeIndex(10, 'gmin')).toBe(10)
    expect(parseGradeIndex(46, 'gmax')).toBe(46)
  })

  test('should throw for undefined', () => {
    expect(() => parseGradeIndex(undefined, 'gmin')).toThrow(
      'Missing required parameter: gmin',
    )
  })

  test('should throw for empty string', () => {
    expect(() => parseGradeIndex('', 'gmin')).toThrow(
      'Missing required parameter: gmin',
    )
  })

  test('should throw for non-numeric', () => {
    expect(() => parseGradeIndex('6a', 'gmin')).toThrow(
      'Invalid gmin: must be a number',
    )
  })

  test('should throw for below minimum', () => {
    expect(() => parseGradeIndex(5, 'gmin')).toThrow('out of range')
  })

  test('should throw for above maximum', () => {
    expect(() => parseGradeIndex(50, 'gmax')).toThrow('out of range')
  })
})

describe('parseOptionalGradeIndex', () => {
  test('should return grade index when valid', () => {
    expect(parseOptionalGradeIndex(24, 10)).toBe(24)
  })

  test('should return default for undefined', () => {
    expect(parseOptionalGradeIndex(undefined, 10)).toBe(10)
  })

  test('should return default for out of range', () => {
    expect(parseOptionalGradeIndex(5, 10)).toBe(10)
    expect(parseOptionalGradeIndex(50, 10)).toBe(10)
  })
})

describe('parseNumber', () => {
  test('should parse valid numbers', () => {
    expect(parseNumber(42, 0)).toBe(42)
    expect(parseNumber('42', 0)).toBe(42)
    expect(parseNumber(3.14, 0)).toBeCloseTo(3.14)
  })

  test('should return default for undefined', () => {
    expect(parseNumber(undefined, 20)).toBe(20)
  })

  test('should return default for NaN', () => {
    expect(parseNumber('invalid', 20)).toBe(20)
  })
})

describe('parseRequiredNumber', () => {
  test('should parse valid numbers', () => {
    expect(parseRequiredNumber(42, 'value')).toBe(42)
    expect(parseRequiredNumber('42', 'value')).toBe(42)
  })

  test('should throw for undefined', () => {
    expect(() => parseRequiredNumber(undefined, 'value')).toThrow(
      'Missing required parameter: value',
    )
  })

  test('should throw for invalid', () => {
    expect(() => parseRequiredNumber('invalid', 'value')).toThrow(
      'Invalid value: must be a valid number',
    )
  })
})

describe('parseLatitude', () => {
  test('should parse valid latitude', () => {
    expect(parseLatitude(41.7)).toBe(41.7)
    expect(parseLatitude('41.7')).toBe(41.7)
    expect(parseLatitude(0)).toBe(0)
    expect(parseLatitude(-90)).toBe(-90)
    expect(parseLatitude(90)).toBe(90)
  })

  test('should throw for out of range', () => {
    expect(() => parseLatitude(91)).toThrow('must be between -90 and 90')
    expect(() => parseLatitude(-91)).toThrow('must be between -90 and 90')
  })
})

describe('parseLongitude', () => {
  test('should parse valid longitude', () => {
    expect(parseLongitude(1.8)).toBe(1.8)
    expect(parseLongitude('1.8')).toBe(1.8)
    expect(parseLongitude(0)).toBe(0)
    expect(parseLongitude(-180)).toBe(-180)
    expect(parseLongitude(180)).toBe(180)
  })

  test('should throw for out of range', () => {
    expect(() => parseLongitude(181)).toThrow('must be between -180 and 180')
    expect(() => parseLongitude(-181)).toThrow('must be between -180 and 180')
  })
})
