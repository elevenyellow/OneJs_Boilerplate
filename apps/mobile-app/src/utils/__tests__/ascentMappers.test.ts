/**
 * Unit Tests for Ascent Mappers
 *
 * Tests the conversion functions that map frontend form values
 * to numeric values expected by the backend API.
 */

import { describe, it, expect } from 'bun:test'
import {
  ascentStyleToNumber,
  gradeEvaluationToNumber,
  wallTypeToNumber,
  characteristicsToBitmask,
  safetyConcernsToBitmask,
  convertUniversalGradeIndexToGradeBand,
} from '../ascentMappers'
import type {
  AscentStyle,
  GradeEvaluation,
  WallType,
  RouteCharacteristic,
  SafetyConcern,
} from '@/components/logbook/types'

describe('ascentStyleToNumber', () => {
  it('should map onsight to 0', () => {
    expect(ascentStyleToNumber('onsight' as AscentStyle)).toBe(0)
  })

  it('should map flash to 1', () => {
    expect(ascentStyleToNumber('flash' as AscentStyle)).toBe(1)
  })

  it('should map redpoint to 2', () => {
    expect(ascentStyleToNumber('redpoint' as AscentStyle)).toBe(2)
  })

  it('should map go to 3', () => {
    expect(ascentStyleToNumber('go' as AscentStyle)).toBe(3)
  })

  it('should map toprope to 4', () => {
    expect(ascentStyleToNumber('toprope' as AscentStyle)).toBe(4)
  })

  it('should return a number', () => {
    const result = ascentStyleToNumber('onsight' as AscentStyle)
    expect(typeof result).toBe('number')
  })
})

describe('gradeEvaluationToNumber', () => {
  it('should map soft to 0', () => {
    expect(gradeEvaluationToNumber('soft' as GradeEvaluation)).toBe(0)
  })

  it('should map normal to 1', () => {
    expect(gradeEvaluationToNumber('normal' as GradeEvaluation)).toBe(1)
  })

  it('should map hard to 2', () => {
    expect(gradeEvaluationToNumber('hard' as GradeEvaluation)).toBe(2)
  })

  it('should return a number', () => {
    const result = gradeEvaluationToNumber('normal' as GradeEvaluation)
    expect(typeof result).toBe('number')
  })
})

describe('wallTypeToNumber', () => {
  it('should map slab to 0', () => {
    expect(wallTypeToNumber('slab' as WallType)).toBe(0)
  })

  it('should map vertical to 1', () => {
    expect(wallTypeToNumber('vertical' as WallType)).toBe(1)
  })

  it('should map overhang to 2', () => {
    expect(wallTypeToNumber('overhang' as WallType)).toBe(2)
  })

  it('should map roof to 3', () => {
    expect(wallTypeToNumber('roof' as WallType)).toBe(3)
  })

  it('should return null when input is null', () => {
    expect(wallTypeToNumber(null)).toBe(null)
  })

  it('should return a number or null', () => {
    const result1 = wallTypeToNumber('slab' as WallType)
    const result2 = wallTypeToNumber(null)
    expect(typeof result1 === 'number' || result1 === null).toBe(true)
    expect(result2).toBe(null)
  })
})

describe('characteristicsToBitmask', () => {
  it('should return 0 for empty array', () => {
    expect(characteristicsToBitmask([])).toBe(0)
  })

  it('should map cruxy to 1 (1 << 0)', () => {
    expect(characteristicsToBitmask(['cruxy'] as RouteCharacteristic[])).toBe(1)
  })

  it('should map athletic to 2 (1 << 1)', () => {
    expect(
      characteristicsToBitmask(['athletic'] as RouteCharacteristic[]),
    ).toBe(2)
  })

  it('should map slopers to 4 (1 << 2)', () => {
    expect(characteristicsToBitmask(['slopers'] as RouteCharacteristic[])).toBe(
      4,
    )
  })

  it('should map endurance to 8 (1 << 3)', () => {
    expect(
      characteristicsToBitmask(['endurance'] as RouteCharacteristic[]),
    ).toBe(8)
  })

  it('should map technical to 16 (1 << 4)', () => {
    expect(
      characteristicsToBitmask(['technical'] as RouteCharacteristic[]),
    ).toBe(16)
  })

  it('should map crimpy to 32 (1 << 5)', () => {
    expect(characteristicsToBitmask(['crimpy'] as RouteCharacteristic[])).toBe(
      32,
    )
  })

  it('should combine multiple characteristics with OR', () => {
    // cruxy (1) | technical (16) = 17
    expect(
      characteristicsToBitmask(['cruxy', 'technical'] as RouteCharacteristic[]),
    ).toBe(17)
  })

  it('should combine all characteristics correctly', () => {
    // 1 + 2 + 4 + 8 + 16 + 32 = 63
    expect(
      characteristicsToBitmask([
        'cruxy',
        'athletic',
        'slopers',
        'endurance',
        'technical',
        'crimpy',
      ] as RouteCharacteristic[]),
    ).toBe(63)
  })

  it('should handle duplicate values correctly', () => {
    // cruxy (1) | cruxy (1) = 1
    expect(
      characteristicsToBitmask(['cruxy', 'cruxy'] as RouteCharacteristic[]),
    ).toBe(1)
  })

  it('should return a number', () => {
    const result = characteristicsToBitmask(['cruxy'] as RouteCharacteristic[])
    expect(typeof result).toBe('number')
  })
})

describe('safetyConcernsToBitmask', () => {
  it('should return 0 for empty array', () => {
    expect(safetyConcernsToBitmask([])).toBe(0)
  })

  it('should map looseRock to 1 (1 << 0)', () => {
    expect(safetyConcernsToBitmask(['looseRock'] as SafetyConcern[])).toBe(1)
  })

  it('should map highFirstBolt to 2 (1 << 1)', () => {
    expect(safetyConcernsToBitmask(['highFirstBolt'] as SafetyConcern[])).toBe(
      2,
    )
  })

  it('should map badBolts to 4 (1 << 2)', () => {
    expect(safetyConcernsToBitmask(['badBolts'] as SafetyConcern[])).toBe(4)
  })

  it('should map badAnchor to 8 (1 << 3)', () => {
    expect(safetyConcernsToBitmask(['badAnchor'] as SafetyConcern[])).toBe(8)
  })

  it('should combine multiple concerns with OR', () => {
    // looseRock (1) | badBolts (4) = 5
    expect(
      safetyConcernsToBitmask(['looseRock', 'badBolts'] as SafetyConcern[]),
    ).toBe(5)
  })

  it('should combine all concerns correctly', () => {
    // 1 + 2 + 4 + 8 = 15
    expect(
      safetyConcernsToBitmask([
        'looseRock',
        'highFirstBolt',
        'badBolts',
        'badAnchor',
      ] as SafetyConcern[]),
    ).toBe(15)
  })

  it('should handle duplicate values correctly', () => {
    // looseRock (1) | looseRock (1) = 1
    expect(
      safetyConcernsToBitmask(['looseRock', 'looseRock'] as SafetyConcern[]),
    ).toBe(1)
  })

  it('should return a number', () => {
    const result = safetyConcernsToBitmask(['looseRock'] as SafetyConcern[])
    expect(typeof result).toBe('number')
  })
})

describe('convertUniversalGradeIndexToGradeBand', () => {
  describe('Beginner range (10-17)', () => {
    it('should map 10 to band 1', () => {
      expect(convertUniversalGradeIndexToGradeBand(10)).toBe(1)
    })

    it('should map 15 to band 1', () => {
      expect(convertUniversalGradeIndexToGradeBand(15)).toBe(1)
    })

    it('should map 17 to band 1', () => {
      expect(convertUniversalGradeIndexToGradeBand(17)).toBe(1)
    })
  })

  describe('Intermediate range (18-28)', () => {
    it('should map 18 to band 2', () => {
      expect(convertUniversalGradeIndexToGradeBand(18)).toBe(2)
    })

    it('should map 22 to band 2', () => {
      expect(convertUniversalGradeIndexToGradeBand(22)).toBe(2)
    })

    it('should map 28 to band 2', () => {
      expect(convertUniversalGradeIndexToGradeBand(28)).toBe(2)
    })
  })

  describe('Advanced range (29-37)', () => {
    it('should map 29 to band 3', () => {
      expect(convertUniversalGradeIndexToGradeBand(29)).toBe(3)
    })

    it('should map 32 to band 3', () => {
      expect(convertUniversalGradeIndexToGradeBand(32)).toBe(3)
    })

    it('should map 37 to band 3', () => {
      expect(convertUniversalGradeIndexToGradeBand(37)).toBe(3)
    })
  })

  describe('Expert range (38-45)', () => {
    it('should map 38 to band 4', () => {
      expect(convertUniversalGradeIndexToGradeBand(38)).toBe(4)
    })

    it('should map 40 to band 4', () => {
      expect(convertUniversalGradeIndexToGradeBand(40)).toBe(4)
    })

    it('should map 45 to band 4', () => {
      expect(convertUniversalGradeIndexToGradeBand(45)).toBe(4)
    })
  })

  describe('Elite range (46-52)', () => {
    it('should map 46 to band 5', () => {
      expect(convertUniversalGradeIndexToGradeBand(46)).toBe(5)
    })

    it('should map 48 to band 5', () => {
      expect(convertUniversalGradeIndexToGradeBand(48)).toBe(5)
    })

    it('should map 52 to band 5', () => {
      expect(convertUniversalGradeIndexToGradeBand(52)).toBe(5)
    })
  })

  describe('Invalid ranges', () => {
    it('should throw error for value below 10', () => {
      expect(() => convertUniversalGradeIndexToGradeBand(9)).toThrow(
        'Invalid universal grade index: 9',
      )
    })

    it('should throw error for value above 52', () => {
      expect(() => convertUniversalGradeIndexToGradeBand(53)).toThrow(
        'Invalid universal grade index: 53',
      )
    })

    it('should throw error for 0', () => {
      expect(() => convertUniversalGradeIndexToGradeBand(0)).toThrow()
    })

    it('should throw error for negative value', () => {
      expect(() => convertUniversalGradeIndexToGradeBand(-1)).toThrow()
    })
  })

  it('should return a number between 1 and 5 for valid input', () => {
    const result = convertUniversalGradeIndexToGradeBand(25)
    expect(typeof result).toBe('number')
    expect(result).toBeGreaterThanOrEqual(1)
    expect(result).toBeLessThanOrEqual(5)
  })
})

// Edge cases and validation tests
describe('Mapper Edge Cases', () => {
  describe('characteristicsToBitmask edge cases', () => {
    it('should handle order independence', () => {
      const result1 = characteristicsToBitmask([
        'cruxy',
        'technical',
      ] as RouteCharacteristic[])
      const result2 = characteristicsToBitmask([
        'technical',
        'cruxy',
      ] as RouteCharacteristic[])
      expect(result1).toBe(result2)
    })

    it('should be idempotent for same input', () => {
      const input = ['athletic', 'endurance'] as RouteCharacteristic[]
      const result1 = characteristicsToBitmask(input)
      const result2 = characteristicsToBitmask(input)
      expect(result1).toBe(result2)
    })
  })

  describe('safetyConcernsToBitmask edge cases', () => {
    it('should handle order independence', () => {
      const result1 = safetyConcernsToBitmask([
        'looseRock',
        'badBolts',
      ] as SafetyConcern[])
      const result2 = safetyConcernsToBitmask([
        'badBolts',
        'looseRock',
      ] as SafetyConcern[])
      expect(result1).toBe(result2)
    })

    it('should be idempotent for same input', () => {
      const input = ['highFirstBolt', 'badAnchor'] as SafetyConcern[]
      const result1 = safetyConcernsToBitmask(input)
      const result2 = safetyConcernsToBitmask(input)
      expect(result1).toBe(result2)
    })
  })
})

// Integration-like tests for mapper combinations
describe('Mapper Integration', () => {
  it('should produce correct payload structure for typical form data', () => {
    const formData = {
      style: 'redpoint' as AscentStyle,
      gradeEvaluation: 'normal' as GradeEvaluation,
      wallType: 'vertical' as WallType,
      characteristics: ['technical', 'crimpy'] as RouteCharacteristic[],
      safetyConcerns: [] as SafetyConcern[],
    }

    const payload = {
      style: ascentStyleToNumber(formData.style),
      gradeEvaluation: gradeEvaluationToNumber(formData.gradeEvaluation),
      wallType: wallTypeToNumber(formData.wallType),
      characteristics: characteristicsToBitmask(formData.characteristics),
      safetyConcerns: safetyConcernsToBitmask(formData.safetyConcerns),
    }

    expect(payload).toEqual({
      style: 2,
      gradeEvaluation: 1,
      wallType: 1,
      characteristics: 48, // 16 (technical) | 32 (crimpy) = 48
      safetyConcerns: 0,
    })
  })

  it('should handle minimal form data', () => {
    const formData = {
      style: 'onsight' as AscentStyle,
      gradeEvaluation: 'normal' as GradeEvaluation,
      wallType: null,
      characteristics: [] as RouteCharacteristic[],
      safetyConcerns: [] as SafetyConcern[],
    }

    const payload = {
      style: ascentStyleToNumber(formData.style),
      gradeEvaluation: gradeEvaluationToNumber(formData.gradeEvaluation),
      wallType: wallTypeToNumber(formData.wallType),
      characteristics: characteristicsToBitmask(formData.characteristics),
      safetyConcerns: safetyConcernsToBitmask(formData.safetyConcerns),
    }

    expect(payload).toEqual({
      style: 0,
      gradeEvaluation: 1,
      wallType: null,
      characteristics: 0,
      safetyConcerns: 0,
    })
  })

  it('should handle maximal form data', () => {
    const formData = {
      style: 'toprope' as AscentStyle,
      gradeEvaluation: 'hard' as GradeEvaluation,
      wallType: 'roof' as WallType,
      characteristics: [
        'cruxy',
        'athletic',
        'slopers',
        'endurance',
        'technical',
        'crimpy',
      ] as RouteCharacteristic[],
      safetyConcerns: [
        'looseRock',
        'highFirstBolt',
        'badBolts',
        'badAnchor',
      ] as SafetyConcern[],
    }

    const payload = {
      style: ascentStyleToNumber(formData.style),
      gradeEvaluation: gradeEvaluationToNumber(formData.gradeEvaluation),
      wallType: wallTypeToNumber(formData.wallType),
      characteristics: characteristicsToBitmask(formData.characteristics),
      safetyConcerns: safetyConcernsToBitmask(formData.safetyConcerns),
    }

    expect(payload).toEqual({
      style: 4,
      gradeEvaluation: 2,
      wallType: 3,
      characteristics: 63, // All bits set
      safetyConcerns: 15, // All bits set
    })
  })
})
