/**
 * Unit Tests for Ascents API Service
 *
 * Tests the payload generation logic for createAscent.
 * Focuses on verifying correct data transformation from form to API format.
 */

import { describe, it, expect } from 'bun:test'
import type { LogAscentFormState } from '@/components/logbook/types'
import {
  ascentStyleToNumber,
  gradeEvaluationToNumber,
  wallTypeToNumber,
  characteristicsToBitmask,
  safetyConcernsToBitmask,
  convertUniversalGradeIndexToGradeBand,
} from '@/utils/ascentMappers'

/**
 * Helper function to generate payload like createAscent does
 * This allows testing without mocking the API client
 */
function generateAscentPayload(
  formState: LogAscentFormState,
  routeId: string,
  routeGradeBand: number,
) {
  const gradeBand = convertUniversalGradeIndexToGradeBand(routeGradeBand)

  return {
    routeId,
    style: ascentStyleToNumber(formState.style),
    gradeBand,
    gradeEvaluation: gradeEvaluationToNumber(formState.gradeEvaluation),
    wallType: wallTypeToNumber(formState.wallType),
    characteristics: characteristicsToBitmask(formState.characteristics),
    safetyConcerns: safetyConcernsToBitmask(formState.safetyConcerns),
    quality: formState.quality,
    tries: formState.tries,
    isRepeat: formState.isRepeat,
    comments: formState.comments || null,
    ascentDate: formState.date.toISOString(),
  }
}

describe('createAscent Payload Generation', () => {
  describe('Complete Payload Structure', () => {
    it('should generate correct payload with all fields populated', () => {
      const formState: LogAscentFormState = {
        style: 'redpoint',
        date: new Date('2026-01-17T12:00:00.000Z'),
        isRepeat: false,
        tries: 3,
        gradeEvaluation: 'normal',
        wallType: 'vertical',
        characteristics: ['technical', 'crimpy'],
        safetyConcerns: [],
        quality: 4,
        comments: 'Great route!',
      }

      const routeId = 'route-123'
      const routeGradeBand = 22 // Intermediate

      const payload = generateAscentPayload(formState, routeId, routeGradeBand)

      expect(payload).toEqual({
        routeId: 'route-123',
        style: 2, // redpoint
        gradeBand: 2, // Intermediate (from universal 22)
        gradeEvaluation: 1, // normal
        wallType: 1, // vertical
        characteristics: 48, // technical (16) | crimpy (32)
        safetyConcerns: 0,
        quality: 4,
        tries: 3,
        isRepeat: false,
        comments: 'Great route!',
        ascentDate: '2026-01-17T12:00:00.000Z',
      })
    })

    it('should generate minimal payload with required fields only', () => {
      const formState: LogAscentFormState = {
        style: 'onsight',
        date: new Date('2026-01-17T12:00:00.000Z'),
        isRepeat: false,
        tries: 1,
        gradeEvaluation: 'normal',
        wallType: null,
        characteristics: [],
        safetyConcerns: [],
        quality: 3,
        comments: '',
      }

      const payload = generateAscentPayload(formState, 'route-min', 15)

      expect(payload).toEqual({
        routeId: 'route-min',
        style: 0, // onsight
        gradeBand: 1, // Beginner
        gradeEvaluation: 1, // normal
        wallType: null,
        characteristics: 0,
        safetyConcerns: 0,
        quality: 3,
        tries: 1,
        isRepeat: false,
        comments: null,
        ascentDate: '2026-01-17T12:00:00.000Z',
      })
    })

    it('should generate maximal payload with all optional fields', () => {
      const formState: LogAscentFormState = {
        style: 'toprope',
        date: new Date('2026-01-17T12:00:00.000Z'),
        isRepeat: true,
        tries: 10,
        gradeEvaluation: 'hard',
        wallType: 'roof',
        characteristics: [
          'cruxy',
          'athletic',
          'slopers',
          'endurance',
          'technical',
          'crimpy',
        ],
        safetyConcerns: ['looseRock', 'highFirstBolt', 'badBolts', 'badAnchor'],
        quality: 5,
        comments: 'Epic send!',
      }

      const payload = generateAscentPayload(formState, 'route-max', 48)

      expect(payload).toEqual({
        routeId: 'route-max',
        style: 4, // toprope
        gradeBand: 5, // Elite
        gradeEvaluation: 2, // hard
        wallType: 3, // roof
        characteristics: 63, // All 6 characteristics
        safetyConcerns: 15, // All 4 concerns
        quality: 5,
        tries: 10,
        isRepeat: true,
        comments: 'Epic send!',
        ascentDate: '2026-01-17T12:00:00.000Z',
      })
    })
  })

  describe('Field Type Validation', () => {
    it('should have correct types for all fields', () => {
      const formState: LogAscentFormState = {
        style: 'redpoint',
        date: new Date('2026-01-17T12:00:00.000Z'),
        isRepeat: false,
        tries: 3,
        gradeEvaluation: 'normal',
        wallType: 'vertical',
        characteristics: ['technical'],
        safetyConcerns: ['looseRock'],
        quality: 4,
        comments: 'Test',
      }

      const payload = generateAscentPayload(formState, 'route-types', 22)

      expect(typeof payload.routeId).toBe('string')
      expect(typeof payload.style).toBe('number')
      expect(typeof payload.gradeBand).toBe('number')
      expect(typeof payload.gradeEvaluation).toBe('number')
      expect(
        typeof payload.wallType === 'number' || payload.wallType === null,
      ).toBe(true)
      expect(typeof payload.characteristics).toBe('number')
      expect(typeof payload.safetyConcerns).toBe('number')
      expect(typeof payload.quality).toBe('number')
      expect(typeof payload.tries).toBe('number')
      expect(typeof payload.isRepeat).toBe('boolean')
      expect(
        typeof payload.comments === 'string' || payload.comments === null,
      ).toBe(true)
      expect(typeof payload.ascentDate).toBe('string')
    })
  })

  describe('Comments Handling', () => {
    it('should convert empty string comments to null', () => {
      const formState: LogAscentFormState = {
        style: 'flash',
        date: new Date(),
        isRepeat: false,
        tries: 1,
        gradeEvaluation: 'normal',
        wallType: null,
        characteristics: [],
        safetyConcerns: [],
        quality: 4,
        comments: '',
      }

      const payload = generateAscentPayload(formState, 'route-1', 20)
      expect(payload.comments).toBe(null)
    })

    it('should preserve non-empty comments', () => {
      const formState: LogAscentFormState = {
        style: 'redpoint',
        date: new Date(),
        isRepeat: false,
        tries: 5,
        gradeEvaluation: 'hard',
        wallType: 'overhang',
        characteristics: ['cruxy'],
        safetyConcerns: [],
        quality: 5,
        comments: 'Amazing route!',
      }

      const payload = generateAscentPayload(formState, 'route-2', 35)
      expect(payload.comments).toBe('Amazing route!')
    })
  })

  describe('Date Conversion', () => {
    it('should convert Date to ISO string format', () => {
      const testDate = new Date('2026-01-17T15:30:45.123Z')
      const formState: LogAscentFormState = {
        style: 'onsight',
        date: testDate,
        isRepeat: false,
        tries: 1,
        gradeEvaluation: 'soft',
        wallType: null,
        characteristics: [],
        safetyConcerns: [],
        quality: 5,
        comments: '',
      }

      const payload = generateAscentPayload(formState, 'route-date', 15)
      expect(payload.ascentDate).toBe('2026-01-17T15:30:45.123Z')
    })

    it('should handle timezone correctly', () => {
      const testDate = new Date('2026-01-17T00:00:00.000Z')
      const formState: LogAscentFormState = {
        style: 'flash',
        date: testDate,
        isRepeat: false,
        tries: 1,
        gradeEvaluation: 'normal',
        wallType: null,
        characteristics: [],
        safetyConcerns: [],
        quality: 4,
        comments: '',
      }

      const payload = generateAscentPayload(formState, 'route-tz', 18)
      expect(payload.ascentDate).toBe('2026-01-17T00:00:00.000Z')
      expect(payload.ascentDate.endsWith('Z')).toBe(true)
    })
  })

  describe('Grade Band Conversion in Payload', () => {
    const baseForm: LogAscentFormState = {
      style: 'redpoint',
      date: new Date(),
      isRepeat: false,
      tries: 3,
      gradeEvaluation: 'normal',
      wallType: null,
      characteristics: [],
      safetyConcerns: [],
      quality: 4,
      comments: '',
    }

    it('should convert beginner grade (10-17) to band 1', () => {
      const payload = generateAscentPayload(baseForm, 'route-1', 15)
      expect(payload.gradeBand).toBe(1)
    })

    it('should convert intermediate grade (18-28) to band 2', () => {
      const payload = generateAscentPayload(baseForm, 'route-2', 22)
      expect(payload.gradeBand).toBe(2)
    })

    it('should convert advanced grade (29-37) to band 3', () => {
      const payload = generateAscentPayload(baseForm, 'route-3', 32)
      expect(payload.gradeBand).toBe(3)
    })

    it('should convert expert grade (38-45) to band 4', () => {
      const payload = generateAscentPayload(baseForm, 'route-4', 40)
      expect(payload.gradeBand).toBe(4)
    })

    it('should convert elite grade (46-52) to band 5', () => {
      const payload = generateAscentPayload(baseForm, 'route-5', 48)
      expect(payload.gradeBand).toBe(5)
    })
  })

  describe('RouteId Handling', () => {
    const baseForm: LogAscentFormState = {
      style: 'onsight',
      date: new Date(),
      isRepeat: false,
      tries: 1,
      gradeEvaluation: 'normal',
      wallType: null,
      characteristics: [],
      safetyConcerns: [],
      quality: 5,
      comments: '',
    }

    it('should include routeId in payload', () => {
      const routeId = 'test-route-123'
      const payload = generateAscentPayload(baseForm, routeId, 15)
      expect(payload.routeId).toBe(routeId)
    })

    it('should handle UUID format routeIds', () => {
      const routeId = '550e8400-e29b-41d4-a716-446655440000'
      const payload = generateAscentPayload(baseForm, routeId, 20)
      expect(payload.routeId).toBe(routeId)
    })

    it('should handle short routeIds', () => {
      const routeId = 'r1'
      const payload = generateAscentPayload(baseForm, routeId, 25)
      expect(payload.routeId).toBe(routeId)
    })
  })

  describe('Real-World Scenarios', () => {
    it('should handle typical sport climbing ascent', () => {
      const formState: LogAscentFormState = {
        style: 'redpoint',
        date: new Date('2026-01-17T14:00:00.000Z'),
        isRepeat: false,
        tries: 5,
        gradeEvaluation: 'normal',
        wallType: 'vertical',
        characteristics: ['technical', 'endurance'],
        safetyConcerns: [],
        quality: 4,
        comments: 'Fun route, good for endurance training',
      }

      const payload = generateAscentPayload(formState, 'sport-route-1', 28)

      expect(payload.style).toBe(2) // redpoint
      expect(payload.gradeBand).toBe(2) // Intermediate
      expect(payload.characteristics).toBe(24) // technical (16) | endurance (8)
      expect(payload.tries).toBe(5)
      expect(payload.quality).toBe(4)
    })

    it('should handle onsight attempt on beginner route', () => {
      const formState: LogAscentFormState = {
        style: 'onsight',
        date: new Date('2026-01-17T10:00:00.000Z'),
        isRepeat: false,
        tries: 1,
        gradeEvaluation: 'soft',
        wallType: 'slab',
        characteristics: [],
        safetyConcerns: [],
        quality: 3,
        comments: 'Easy warmup',
      }

      const payload = generateAscentPayload(formState, 'easy-slab', 12)

      expect(payload.style).toBe(0) // onsight
      expect(payload.gradeBand).toBe(1) // Beginner
      expect(payload.wallType).toBe(0) // slab
      expect(payload.gradeEvaluation).toBe(0) // soft
      expect(payload.tries).toBe(1)
    })

    it('should handle project with multiple attempts and safety concerns', () => {
      const formState: LogAscentFormState = {
        style: 'go',
        date: new Date('2026-01-17T16:00:00.000Z'),
        isRepeat: false,
        tries: 15,
        gradeEvaluation: 'hard',
        wallType: 'overhang',
        characteristics: ['cruxy', 'athletic', 'crimpy'],
        safetyConcerns: ['highFirstBolt', 'badBolts'],
        quality: 5,
        comments: 'Long-term project, finally sent!',
      }

      const payload = generateAscentPayload(formState, 'project-route', 42)

      expect(payload.style).toBe(3) // go
      expect(payload.gradeBand).toBe(4) // Expert
      expect(payload.wallType).toBe(2) // overhang
      expect(payload.characteristics).toBe(35) // cruxy (1) | athletic (2) | crimpy (32)
      expect(payload.safetyConcerns).toBe(6) // highFirstBolt (2) | badBolts (4)
      expect(payload.tries).toBe(15)
      expect(payload.gradeEvaluation).toBe(2) // hard
    })
  })
})
