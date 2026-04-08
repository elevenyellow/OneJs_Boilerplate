import { describe, expect, it } from 'bun:test'
import { TaskId } from '../../../domain/value-objects/task-id'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('TaskId', () => {
  describe('generateUniqueId()', () => {
    it('creates a valid UUID v4', () => {
      const id = TaskId.generateUniqueId()
      expect(id.getValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
    })

    it('each call produces a unique id', () => {
      expect(TaskId.generateUniqueId().getValue()).not.toBe(TaskId.generateUniqueId().getValue())
    })
  })

  describe('fromString()', () => {
    it('creates from a valid UUID v4', () => {
      const id = TaskId.fromString(VALID_UUID)
      expect(id.getValue()).toBe(VALID_UUID)
    })

    it('throws when value is empty', () => {
      expect(() => TaskId.fromString('')).toThrow('TaskId cannot be empty')
    })

    it('throws when value is not a valid UUID v4', () => {
      expect(() => TaskId.fromString('not-a-uuid')).toThrow('Invalid TaskId format')
    })

    it('throws for UUID v1 (wrong version digit)', () => {
      expect(() => TaskId.fromString('550e8400-e29b-11d4-a716-446655440000')).toThrow(
        'Invalid TaskId format',
      )
    })
  })

  describe('equals()', () => {
    it('returns true for the same value', () => {
      expect(TaskId.fromString(VALID_UUID).equals(TaskId.fromString(VALID_UUID))).toBe(true)
    })

    it('returns false for different values', () => {
      expect(TaskId.generateUniqueId().equals(TaskId.generateUniqueId())).toBe(false)
    })
  })

  describe('toString() / getValue()', () => {
    it('both return the underlying string', () => {
      const id = TaskId.fromString(VALID_UUID)
      expect(id.toString()).toBe(VALID_UUID)
      expect(id.getValue()).toBe(VALID_UUID)
    })
  })
})
