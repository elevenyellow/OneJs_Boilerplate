import { describe, expect, test } from 'bun:test'
import { SvgPath } from '../svg-path.vo'

describe('SvgPath Value Object', () => {
  describe('createFrom - theCrag format conversion', () => {
    test('should convert theCrag coordinate format to SVG path', () => {
      // theCrag format: "x1 y1,x2 y2,x3 y3..."
      // Each point is "x y" (space-separated), points are comma-separated
      const theCragFormat = '9 15,49 55,100 120'
      const svgPath = SvgPath.createFrom(theCragFormat)

      // Should become: M x1,y1 L x2,y2 L x3,y3...
      expect(svgPath.getValue()).toBe('M 9,15 L 49,55 L 100,120')
    })

    test('should handle theCrag format with decimal coordinates', () => {
      const theCragFormat = '260 279.5,268.3 200.5,281.1 107.5'
      const svgPath = SvgPath.createFrom(theCragFormat)

      expect(svgPath.getValue()).toBe('M 260,279.5 L 268.3,200.5 L 281.1,107.5')
    })

    test('should handle theCrag format with trailing label', () => {
      const theCragFormat = '260 279.5,268.3 200.5,281.1 107.5 lower'
      const svgPath = SvgPath.createFrom(theCragFormat)

      // Should remove "lower" label and convert coordinates
      expect(svgPath.getValue()).toBe('M 260,279.5 L 268.3,200.5 L 281.1,107.5')
    })

    test('should pass through already valid SVG paths unchanged', () => {
      const validSvgPath = 'M 100,200 L 150,180 L 200,160'
      const svgPath = SvgPath.createFrom(validSvgPath)

      expect(svgPath.getValue()).toBe(validSvgPath)
    })

    test('should handle two-point line', () => {
      // Simple two-point format from theCrag API example
      const simpleFormat = '9 15,49 55'
      const svgPath = SvgPath.createFrom(simpleFormat)

      expect(svgPath.getValue()).toBe('M 9,15 L 49,55')
    })

    test('should return empty string for null input', () => {
      const svgPath = SvgPath.createFrom(null)
      expect(svgPath.getValue()).toBe('')
      expect(svgPath.hasValue()).toBe(false)
    })

    test('should return empty string for undefined input', () => {
      const svgPath = SvgPath.createFrom(undefined)
      expect(svgPath.getValue()).toBe('')
    })

    test('should return empty string for empty string input', () => {
      const svgPath = SvgPath.createFrom('')
      expect(svgPath.getValue()).toBe('')
    })

    test('should return empty string for whitespace-only input', () => {
      const svgPath = SvgPath.createFrom('   ')
      expect(svgPath.getValue()).toBe('')
    })

    test('should handle single coordinate pair', () => {
      const singlePoint = '100 200'
      const svgPath = SvgPath.createFrom(singlePoint)

      expect(svgPath.getValue()).toBe('M 100,200')
    })

    test('should handle real-world theCrag data', () => {
      // Real example from theCrag documentation
      const realData = '139 89,141 120,145 180,150 220'
      const svgPath = SvgPath.createFrom(realData)

      expect(svgPath.getValue()).toBe('M 139,89 L 141,120 L 145,180 L 150,220')
    })
  })

  describe('getPointCount', () => {
    test('should count points in SVG path', () => {
      const svgPath = SvgPath.createFrom('M 100,200 L 150,180 L 200,160')
      expect(svgPath.getPointCount()).toBe(3)
    })

    test('should return 0 for empty path', () => {
      const svgPath = SvgPath.createEmpty()
      expect(svgPath.getPointCount()).toBe(0)
    })
  })

  describe('getPoints', () => {
    test('should extract points from SVG path', () => {
      const svgPath = SvgPath.createFrom('M 100,200 L 150,180 L 200,160')
      const points = svgPath.getPoints()

      expect(points).toHaveLength(3)
      expect(points[0]).toEqual({ x: 100, y: 200 })
      expect(points[1]).toEqual({ x: 150, y: 180 })
      expect(points[2]).toEqual({ x: 200, y: 160 })
    })

    test('should return empty array for empty path', () => {
      const svgPath = SvgPath.createEmpty()
      expect(svgPath.getPoints()).toEqual([])
    })

    test('should handle decimal coordinates', () => {
      const svgPath = SvgPath.createFrom('M 100.5,200.3 L 150.7,180.9')
      const points = svgPath.getPoints()

      expect(points).toHaveLength(2)
      expect(points[0]).toEqual({ x: 100.5, y: 200.3 })
      expect(points[1]).toEqual({ x: 150.7, y: 180.9 })
    })
  })

  describe('isClosed', () => {
    test('should return true for path ending with Z command', () => {
      const svgPath = SvgPath.createFrom('M 100,200 L 150,180 L 200,160 Z')
      expect(svgPath.isClosed()).toBe(true)
    })

    test('should return true for path ending with lowercase z command', () => {
      const svgPath = SvgPath.createFrom('M 100,200 L 150,180 L 200,160 z')
      expect(svgPath.isClosed()).toBe(true)
    })

    test('should return true when first and last points are the same', () => {
      // Polygon where last point equals first point
      const svgPath = SvgPath.createFrom(
        'M 100,200 L 150,180 L 200,160 L 100,200',
      )
      expect(svgPath.isClosed()).toBe(true)
    })

    test('should return true when first and last points are within tolerance', () => {
      // Points within 0.5 tolerance
      const svgPath = SvgPath.createFrom(
        'M 100,200 L 150,180 L 200,160 L 100.3,200.2',
      )
      expect(svgPath.isClosed()).toBe(true)
    })

    test('should return false for open path (route line)', () => {
      // Typical route line - starts at bottom, goes up
      const svgPath = SvgPath.createFrom(
        'M 100,300 L 110,250 L 105,200 L 120,150',
      )
      expect(svgPath.isClosed()).toBe(false)
    })

    test('should return false for two-point line', () => {
      const svgPath = SvgPath.createFrom('M 100,200 L 150,180')
      expect(svgPath.isClosed()).toBe(false)
    })

    test('should return false for single point', () => {
      const svgPath = SvgPath.createFrom('M 100,200')
      expect(svgPath.isClosed()).toBe(false)
    })

    test('should return false for empty path', () => {
      const svgPath = SvgPath.createEmpty()
      expect(svgPath.isClosed()).toBe(false)
    })
  })

  describe('looksLikeAreaBoundary', () => {
    test('should return true for path with true backtracking (returns to same point)', () => {
      // Path goes down, returns to starting point, then goes right - clear area indicator
      // This is the problematic Cheste path that was incorrectly classified
      const svgPath = SvgPath.createFrom(
        'M 327.6,117.6 L 327.6,245.5 L 327.6,117.6 L 517.8,117.6 L 517.8,245.5',
      )
      expect(svgPath.looksLikeAreaBoundary()).toBe(true)
    })

    test('should return true for wide rectangular path with orthogonal segments', () => {
      // Wide rectangle - horizontal span > 1.5x vertical + orthogonal segments
      const svgPath = SvgPath.createFrom(
        'M 10,100 L 200,100 L 200,150 L 10,150 L 10,100',
      )
      expect(svgPath.looksLikeAreaBoundary()).toBe(true)
    })

    test('should return false for typical climbing route path', () => {
      // Route line - starts at bottom, goes up with some horizontal variation
      const svgPath = SvgPath.createFrom(
        'M 112.5,204.3 L 84.7,120.6 L 60.8,58.9 L 60.5,26.2',
      )
      expect(svgPath.looksLikeAreaBoundary()).toBe(false)
    })

    test('should return false for vertical route path (no backtracking)', () => {
      // Vertical climbing line - similar X coordinates but different Y
      // This was causing false positives before the fix
      const svgPath = SvgPath.createFrom(
        'M 395.1,241.2 L 396.6,197.1 L 397.5,174.6 L 396.6,160.2 L 395.1,127.3 L 397.5,89.2',
      )
      expect(svgPath.looksLikeAreaBoundary()).toBe(false)
    })

    test('should return false for diagonal route path', () => {
      // Diagonal climbing line
      const svgPath = SvgPath.createFrom(
        'M 100,300 L 120,250 L 140,200 L 160,150 L 180,100',
      )
      expect(svgPath.looksLikeAreaBoundary()).toBe(false)
    })

    test('should return false for small paths regardless of shape', () => {
      // Small rectangle - dimensions too small for area detection
      const svgPath = SvgPath.createFrom('M 0,0 L 40,0 L 40,20 L 0,20')
      expect(svgPath.looksLikeAreaBoundary()).toBe(false)
    })

    test('should return false for two-point line', () => {
      const svgPath = SvgPath.createFrom('M 100,200 L 150,100')
      expect(svgPath.looksLikeAreaBoundary()).toBe(false)
    })

    test('should return false for three-point path', () => {
      const svgPath = SvgPath.createFrom('M 100,200 L 150,100 L 200,50')
      expect(svgPath.looksLikeAreaBoundary()).toBe(false)
    })

    test('should return false for empty path', () => {
      const svgPath = SvgPath.createEmpty()
      expect(svgPath.looksLikeAreaBoundary()).toBe(false)
    })

    test('should return false for single point', () => {
      const svgPath = SvgPath.createFrom('M 100,200')
      expect(svgPath.looksLikeAreaBoundary()).toBe(false)
    })
  })

  describe('equals', () => {
    test('should return true for equal paths', () => {
      const path1 = SvgPath.createFrom('M 100,200 L 150,180')
      const path2 = SvgPath.createFrom('M 100,200 L 150,180')
      expect(path1.equals(path2)).toBe(true)
    })

    test('should return false for different paths', () => {
      const path1 = SvgPath.createFrom('M 100,200 L 150,180')
      const path2 = SvgPath.createFrom('M 100,200 L 150,190')
      expect(path1.equals(path2)).toBe(false)
    })
  })
})
