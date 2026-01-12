import { describe, expect, test } from 'bun:test'
import { RouteHeight } from '../route-height.vo'

describe('RouteHeight Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create height from number
  // 2. ✓ Create height from string
  // 3. ✓ Create height from array [value, unit]
  // 4. ✓ Return null for null/undefined input
  // 5. ✓ Return null for invalid string
  // 6. ✓ Return null for empty array
  // 7. ✓ Get value in meters
  // 8. ✓ Get formatted string
  // 9. ✓ Equals comparison

  test('should create height from number', () => {
    const height = RouteHeight.parse(25)

    expect(height).not.toBeNull()
    expect(height!.getValue()).toBe(25)
  })

  test('should create height from string', () => {
    const height = RouteHeight.parse('30.5')

    expect(height).not.toBeNull()
    expect(height!.getValue()).toBe(30.5)
  })

  test('should create height from array [value, unit]', () => {
    const height = RouteHeight.parse([15, 'm'])

    expect(height).not.toBeNull()
    expect(height!.getValue()).toBe(15)
  })

  test('should create height from array with string value', () => {
    const height = RouteHeight.parse(['20.5', 'm'])

    expect(height).not.toBeNull()
    expect(height!.getValue()).toBe(20.5)
  })

  test('should return null for null input', () => {
    const height = RouteHeight.parse(null)

    expect(height).toBeNull()
  })

  test('should return null for undefined input', () => {
    const height = RouteHeight.parse(undefined)

    expect(height).toBeNull()
  })

  test('should return null for invalid string', () => {
    const height = RouteHeight.parse('not-a-number')

    expect(height).toBeNull()
  })

  test('should return null for empty array', () => {
    const height = RouteHeight.parse([])

    expect(height).toBeNull()
  })

  test('should get value in meters', () => {
    const height = RouteHeight.parse(25)

    expect(height!.getValue()).toBe(25)
  })

  test('should get formatted string', () => {
    const height = RouteHeight.parse(25)

    expect(height!.toString()).toBe('25m')
  })

  test('should format decimal heights', () => {
    const height = RouteHeight.parse(25.5)

    expect(height!.toString()).toBe('25.5m')
  })

  test('should compare two heights for equality', () => {
    const height1 = RouteHeight.parse(25)
    const height2 = RouteHeight.parse(25)
    const height3 = RouteHeight.parse(30)

    expect(height1!.equals(height2!)).toBe(true)
    expect(height1!.equals(height3!)).toBe(false)
  })

  test('should create directly with create method', () => {
    const height = RouteHeight.create(25)

    expect(height.getValue()).toBe(25)
  })
})
