import { describe, expect, it } from 'bun:test'
import { TaskTitle } from '../../../domain/value-objects/task-title'

describe('TaskTitle', () => {
  it('creates with a valid value', () => {
    const title = TaskTitle.create('Buy milk')
    expect(title.getValue()).toBe('Buy milk')
  })

  it('trims whitespace', () => {
    const title = TaskTitle.create('  Hello  ')
    expect(title.getValue()).toBe('Hello')
  })

  it('throws when value is empty', () => {
    expect(() => TaskTitle.create('')).toThrow('TaskTitle cannot be empty')
  })

  it('throws when value is only whitespace', () => {
    expect(() => TaskTitle.create('   ')).toThrow('TaskTitle cannot be empty')
  })

  it('accepts a title at the max length limit', () => {
    const title = TaskTitle.create('a'.repeat(100))
    expect(title.getValue()).toHaveLength(100)
  })

  it('throws when value exceeds max length', () => {
    expect(() => TaskTitle.create('a'.repeat(101))).toThrow('TaskTitle cannot exceed 100 characters')
  })

  it('equals returns true for same value', () => {
    expect(TaskTitle.create('A').equals(TaskTitle.create('A'))).toBe(true)
  })

  it('equals returns false for different value', () => {
    expect(TaskTitle.create('A').equals(TaskTitle.create('B'))).toBe(false)
  })
})
