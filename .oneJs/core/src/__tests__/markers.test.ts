import { beforeEach, describe, expect, it } from 'bun:test'
import { clearMarkers, getRoles, hasRole, markAs } from '.././markers'

beforeEach(() => clearMarkers())

describe('markers', () => {
  it('markAs + hasRole returns true for the assigned role', () => {
    class MyCtrl {}
    markAs(MyCtrl, 'controller')
    expect(hasRole(MyCtrl, 'controller')).toBe(true)
  })

  it('hasRole returns false for non-assigned role', () => {
    class MyCtrl {}
    markAs(MyCtrl, 'controller')
    expect(hasRole(MyCtrl, 'handler')).toBe(false)
  })

  it('hasRole returns false for unmarked class', () => {
    class Unknown {}
    expect(hasRole(Unknown, 'provider')).toBe(false)
  })

  it('supports multiple roles on the same class', () => {
    class Dual {}
    markAs(Dual, 'provider')
    markAs(Dual, 'handler')

    expect(hasRole(Dual, 'provider')).toBe(true)
    expect(hasRole(Dual, 'handler')).toBe(true)
    expect(hasRole(Dual, 'controller')).toBe(false)
  })

  it('getRoles returns all assigned roles', () => {
    class Multi {}
    markAs(Multi, 'provider')
    markAs(Multi, 'handler')

    const roles = getRoles(Multi)
    expect(roles).toContain('provider')
    expect(roles).toContain('handler')
    expect(roles).toHaveLength(2)
  })

  it('getRoles returns empty array for unmarked class', () => {
    class None {}
    expect(getRoles(None)).toEqual([])
  })

  it('clearMarkers removes all markers', () => {
    class A {}
    class B {}
    markAs(A, 'controller')
    markAs(B, 'provider')

    clearMarkers()

    expect(hasRole(A, 'controller')).toBe(false)
    expect(hasRole(B, 'provider')).toBe(false)
  })
})
