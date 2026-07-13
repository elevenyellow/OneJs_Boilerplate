import { describe, expect, it } from 'bun:test'
import { TaskDescription } from '../../../domain/value-objects/task-description'

describe('TaskDescription', () => {
  it('creates with a valid value', () => {
    const desc = TaskDescription.create('Some details')
    expect(desc.getValue()).toBe('Some details')
  })

  it('allows empty description', () => {
    const desc = TaskDescription.create('')
    expect(desc.getValue()).toBe('')
  })

  it('trims whitespace', () => {
    const desc = TaskDescription.create('  text  ')
    expect(desc.getValue()).toBe('text')
  })

  it('accepts a description at the max length limit', () => {
    const desc = TaskDescription.create('x'.repeat(500))
    expect(desc.getValue()).toHaveLength(500)
  })

  it('throws when value exceeds max length', () => {
    expect(() => TaskDescription.create('x'.repeat(501))).toThrow(
      'TaskDescription cannot exceed 500 characters',
    )
  })

  it('equals returns true for same value', () => {
    expect(
      TaskDescription.create('a').equals(TaskDescription.create('a')),
    ).toBe(true)
  })

  it('equals returns false for different value', () => {
    expect(
      TaskDescription.create('a').equals(TaskDescription.create('b')),
    ).toBe(false)
  })
})
