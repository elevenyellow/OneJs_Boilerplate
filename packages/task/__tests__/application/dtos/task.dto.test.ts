import { describe, expect, it } from 'bun:test'
import { TaskDto, CreateTaskDto } from '../../../application/dtos/task.dto'

describe('TaskDto', () => {
  it('stores all fields as readonly properties', () => {
    const now = new Date()
    const dto = new TaskDto('abc', 'Title', 'Desc', false, now)

    expect(dto.id).toBe('abc')
    expect(dto.title).toBe('Title')
    expect(dto.description).toBe('Desc')
    expect(dto.done).toBe(false)
    expect(dto.createdAt).toBe(now)
  })
})

describe('CreateTaskDto', () => {
  it('stores title and description', () => {
    const dto = new CreateTaskDto('My title', 'My desc')

    expect(dto.title).toBe('My title')
    expect(dto.description).toBe('My desc')
  })
})
