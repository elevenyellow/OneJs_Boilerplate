import { describe, expect, test } from 'bun:test'
import { Ascent } from '../ascent.entity'
import { ASCENT_STYLE, GRADE_EVALUATION, WALL_TYPE } from '../../mappings'

describe('Ascent Entity', () => {
  const validInput = {
    userId: 'user-123',
    routeId: 'route-456',
    style: ASCENT_STYLE.REDPOINT,
    gradeBand: 3,
    gradeEvaluation: GRADE_EVALUATION.NORMAL,
    wallType: WALL_TYPE.OVERHANG,
    characteristics: 25,
    safetyConcerns: 0,
    quality: 4,
    tries: 3,
    isRepeat: false,
    comments: 'Great route!',
    ascentDate: new Date('2025-01-16T10:00:00Z'),
  }

  describe('create', () => {
    test('should create ascent with valid input', () => {
      const ascent = Ascent.create(validInput)

      expect(ascent).toBeInstanceOf(Ascent)
      expect(ascent.getUserId()).toBe('user-123')
      expect(ascent.getRouteId()).toBe('route-456')
      expect(ascent.getStyle().getValue()).toBe(ASCENT_STYLE.REDPOINT)
      expect(ascent.getGradeBand()).toBe(3)
      expect(ascent.getGradeEvaluation().getValue()).toBe(
        GRADE_EVALUATION.NORMAL,
      )
      expect(ascent.getWallType().getValue()).toBe(WALL_TYPE.OVERHANG)
      expect(ascent.getCharacteristics().getValue()).toBe(25)
      expect(ascent.getSafetyConcerns().getValue()).toBe(0)
      expect(ascent.getQuality().getValue()).toBe(4)
      expect(ascent.getTries().getValue()).toBe(3)
      expect(ascent.getIsRepeat()).toBe(false)
      expect(ascent.getComments()).toBe('Great route!')
    })

    test('should generate id when not provided', () => {
      const ascent = Ascent.create(validInput)
      expect(ascent.getId().getValue()).toBeTruthy()
      expect(ascent.getId().getValue().length).toBeGreaterThan(0)
    })

    test('should use provided id when given', () => {
      const ascent = Ascent.create({ ...validInput, id: 'custom-id' })
      expect(ascent.getId().getValue()).toBe('custom-id')
    })

    test('should throw error for empty userId', () => {
      expect(() => Ascent.create({ ...validInput, userId: '' })).toThrow(
        'userId is required',
      )
    })

    test('should throw error for empty routeId', () => {
      expect(() => Ascent.create({ ...validInput, routeId: '' })).toThrow(
        'routeId is required',
      )
    })

    test('should throw error for invalid gradeBand', () => {
      expect(() => Ascent.create({ ...validInput, gradeBand: 0 })).toThrow(
        'Invalid gradeBand: 0',
      )
      expect(() => Ascent.create({ ...validInput, gradeBand: 6 })).toThrow(
        'Invalid gradeBand: 6',
      )
    })

    test('should handle null wallType', () => {
      const ascent = Ascent.create({ ...validInput, wallType: null })
      expect(ascent.getWallType().isNone()).toBe(true)
      expect(ascent.getWallType().getValue()).toBeNull()
    })

    test('should handle null comments', () => {
      const ascent = Ascent.create({ ...validInput, comments: null })
      expect(ascent.getComments()).toBeNull()
    })
  })

  describe('toDatabaseDto', () => {
    test('should convert to database DTO', () => {
      const ascent = Ascent.create({ ...validInput, id: 'test-id' })
      const dto = ascent.toDatabaseDto()

      expect(dto.id).toBe('test-id')
      expect(dto.userId).toBe('user-123')
      expect(dto.routeId).toBe('route-456')
      expect(dto.style).toBe(ASCENT_STYLE.REDPOINT)
      expect(dto.gradeBand).toBe(3)
      expect(dto.gradeEvaluation).toBe(GRADE_EVALUATION.NORMAL)
      expect(dto.wallType).toBe(WALL_TYPE.OVERHANG)
      expect(dto.characteristics).toBe(25)
      expect(dto.safetyConcerns).toBe(0)
      expect(dto.quality).toBe(4)
      expect(dto.tries).toBe(3)
      expect(dto.isRepeat).toBe(false)
      expect(dto.comments).toBe('Great route!')
    })
  })

  describe('toResponseDto', () => {
    test('should convert to response DTO', () => {
      const ascent = Ascent.create({ ...validInput, id: 'test-id' })
      const dto = ascent.toResponseDto()

      expect(dto.id).toBe('test-id')
      expect(dto.style).toBe(ASCENT_STYLE.REDPOINT)
      expect(typeof dto.ascentDate).toBe('string')
      expect(typeof dto.createdAt).toBe('string')
    })
  })

  describe('fromDatabase', () => {
    test('should create ascent from database DTO', () => {
      const dbDto = {
        id: 'db-id',
        userId: 'user-123',
        routeId: 'route-456',
        style: ASCENT_STYLE.FLASH,
        gradeBand: 2,
        gradeEvaluation: GRADE_EVALUATION.SOFT,
        wallType: WALL_TYPE.SLAB,
        characteristics: 8,
        safetyConcerns: 3,
        quality: 5,
        tries: 1,
        isRepeat: true,
        comments: 'Nice!',
        ascentDate: new Date('2025-01-15'),
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-16'),
      }

      const ascent = Ascent.fromDatabase(dbDto)

      expect(ascent.getId().getValue()).toBe('db-id')
      expect(ascent.getStyle().isFlash()).toBe(true)
      expect(ascent.getGradeBand()).toBe(2)
      expect(ascent.getIsRepeat()).toBe(true)
    })
  })
})
