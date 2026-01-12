import { describe, expect, test } from 'bun:test'
import { TopoPath } from '../topo-path.vo'
import { TopoPoint } from '../topo-point.vo'

describe('TopoPath Value Object', () => {
  // TEST CASES LIST (REASON)
  // Order: simple → complex
  //
  // 1. ✓ Create TopoPath from points string (comma-separated segments)
  // 2. ✓ Get array of TopoPoints
  // 3. ✓ Get start point (first point)
  // 4. ✓ Get end point (last point)
  // 5. ✓ Convert to SVG path data (M x y L x y L x y ...)
  // 6. ✓ Convert to polygon points format (x,y x,y x,y)
  // 7. ✓ Parse path with markers (lower, label)
  // 8. ✓ Get point at specific index
  // 9. ✓ Get path length (number of points)
  // 10. ✓ Create path from array of TopoPoints
  // 11. ✓ Throw error for empty points string
  // 12. ✓ Compare two paths for equality

  test('should create TopoPath from comma-separated points string', () => {
    // Arrange
    const pointsString = '136.3 334.8,139 268,164.1 159.9'

    // Act
    const path = TopoPath.parseFromPointsString(pointsString)

    // Assert
    expect(path).toBeInstanceOf(TopoPath)
    expect(path.getLength()).toBe(3)
  })

  test('should get array of TopoPoints', () => {
    // Arrange
    const pointsString = '100 200,150 250,200 300'

    // Act
    const path = TopoPath.parseFromPointsString(pointsString)
    const points = path.getPoints()

    // Assert
    expect(points).toHaveLength(3)
    expect(points[0].getX()).toBe(100)
    expect(points[0].getY()).toBe(200)
    expect(points[2].getX()).toBe(200)
    expect(points[2].getY()).toBe(300)
  })

  test('should get start point (first point)', () => {
    // Arrange
    const pointsString = '100 200,150 250,200 300'
    const path = TopoPath.parseFromPointsString(pointsString)

    // Act
    const startPoint = path.getStartPoint()

    // Assert
    expect(startPoint.getX()).toBe(100)
    expect(startPoint.getY()).toBe(200)
  })

  test('should get end point (last point)', () => {
    // Arrange
    const pointsString = '100 200,150 250,200 300'
    const path = TopoPath.parseFromPointsString(pointsString)

    // Act
    const endPoint = path.getEndPoint()

    // Assert
    expect(endPoint.getX()).toBe(200)
    expect(endPoint.getY()).toBe(300)
  })

  test('should convert to SVG path data', () => {
    // Arrange
    const pointsString = '100 200,150 250,200 300'
    const path = TopoPath.parseFromPointsString(pointsString)

    // Act
    const svgPathData = path.toSvgPathData()

    // Assert
    expect(svgPathData).toBe('M 100 200 L 150 250 L 200 300')
  })

  test('should convert to polygon points format', () => {
    // Arrange
    const pointsString = '100 200,150 250,200 300'
    const path = TopoPath.parseFromPointsString(pointsString)

    // Act
    const polygonPoints = path.toPolygonPoints()

    // Assert
    expect(polygonPoints).toBe('100,200 150,250 200,300')
  })

  test('should parse path with markers', () => {
    // Arrange
    const pointsString = '136.3 334.8,139 268,164.1 159.9 lower'

    // Act
    const path = TopoPath.parseFromPointsString(pointsString)

    // Assert
    expect(path.getLength()).toBe(3)
    const endPoint = path.getEndPoint()
    expect(endPoint.getMarker()).toBe('lower')
  })

  test('should get point at specific index', () => {
    // Arrange
    const pointsString = '100 200,150 250,200 300'
    const path = TopoPath.parseFromPointsString(pointsString)

    // Act
    const point = path.getPointAt(1)

    // Assert
    expect(point.getX()).toBe(150)
    expect(point.getY()).toBe(250)
  })

  test('should get path length (number of points)', () => {
    // Arrange
    const pointsString = '100 200,150 250,200 300,250 350'
    const path = TopoPath.parseFromPointsString(pointsString)

    // Act
    const length = path.getLength()

    // Assert
    expect(length).toBe(4)
  })

  test('should create path from array of TopoPoints', () => {
    // Arrange
    const points = [
      TopoPoint.parseFromSegment('100 200'),
      TopoPoint.parseFromSegment('150 250'),
      TopoPoint.parseFromSegment('200 300'),
    ]

    // Act
    const path = TopoPath.createFrom(points)

    // Assert
    expect(path.getLength()).toBe(3)
    expect(path.getStartPoint().getX()).toBe(100)
    expect(path.getEndPoint().getX()).toBe(200)
  })

  test('should throw error for empty points string', () => {
    // Arrange
    const pointsString = ''

    // Act & Assert
    expect(() => TopoPath.parseFromPointsString(pointsString)).toThrow(
      'Invalid path',
    )
  })

  test('should compare two paths for equality', () => {
    // Arrange
    const path1 = TopoPath.parseFromPointsString('100 200,150 250')
    const path2 = TopoPath.parseFromPointsString('100 200,150 250')
    const path3 = TopoPath.parseFromPointsString('100 200,150 251')

    // Assert
    expect(path1.equals(path2)).toBe(true)
    expect(path1.equals(path3)).toBe(false)
  })

  test('should find lower marker point in path', () => {
    // Arrange
    const pointsString = '136.3 334.8,139 268,164.1 159.9 lower'
    const path = TopoPath.parseFromPointsString(pointsString)

    // Act
    const lowerPoint = path.getLowerMarkerPoint()

    // Assert
    expect(lowerPoint).not.toBeNull()
    expect(lowerPoint?.getX()).toBe(164.1)
    expect(lowerPoint?.getY()).toBe(159.9)
  })

  test('should return null when no lower marker point exists', () => {
    // Arrange
    const pointsString = '100 200,150 250'
    const path = TopoPath.parseFromPointsString(pointsString)

    // Act
    const lowerPoint = path.getLowerMarkerPoint()

    // Assert
    expect(lowerPoint).toBeNull()
  })

  test('should find label marker point in path', () => {
    // Arrange
    const pointsString = '80 31.1 lbvyd Sargantana,66.1 43,91.9 43'
    const path = TopoPath.parseFromPointsString(pointsString)

    // Act
    const labelPoint = path.getLabelMarkerPoint()

    // Assert
    expect(labelPoint).not.toBeNull()
    expect(labelPoint?.getMarkerLabel()).toBe('Sargantana')
  })
})
