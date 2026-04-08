import { describe, expect, it } from 'bun:test'
import { TaskStatus } from '../../../domain/value-objects/task-status'

describe('TaskStatus', () => {
  it('pending() creates a not-done status', () => {
    expect(TaskStatus.pending().getValue()).toBe(false)
  })

  it('done() creates a done status', () => {
    expect(TaskStatus.done().getValue()).toBe(true)
  })

  it('from(false) creates a not-done status', () => {
    expect(TaskStatus.from(false).getValue()).toBe(false)
  })

  it('from(true) creates a done status', () => {
    expect(TaskStatus.from(true).getValue()).toBe(true)
  })

  it('equals returns true for same status', () => {
    expect(TaskStatus.pending().equals(TaskStatus.pending())).toBe(true)
    expect(TaskStatus.done().equals(TaskStatus.done())).toBe(true)
  })

  it('equals returns false for different status', () => {
    expect(TaskStatus.pending().equals(TaskStatus.done())).toBe(false)
  })
})
