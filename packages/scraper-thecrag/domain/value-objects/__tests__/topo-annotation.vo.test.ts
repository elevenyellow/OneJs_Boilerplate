import { describe, expect, test } from 'bun:test'
import { TopoAnnotation } from '../topo-annotation.vo'

describe('TopoAnnotation Value Object', () => {
  // TEST CASES LIST (REASON)
  // Order: simple → complex
  //
  // 1. ✓ Parse route annotation from topodata JSON
  // 2. ✓ Parse area annotation from topodata JSON
  // 3. ✓ Get annotation id
  // 4. ✓ Get annotation type (route or area)
  // 5. ✓ Get path for route annotation
  // 6. ✓ Get path for area annotation (polygon)
  // 7. ✓ Get grade for route annotation
  // 8. ✓ Get name and URL
  // 9. ✓ Get route-specific properties (stars, style, zindex)
  // 10. ✓ Get order and num
  // 11. ✓ Check if annotation is route or area
  // 12. ✓ Parse multiple annotations from array
  // 13. ✓ Handle annotation with label marker

  const routeTopoDataJson = JSON.stringify([
    {
      id: 1447609059,
      type: 'route',
      num: '1',
      grade: '4',
      class: 'gb1',
      zindex: '1',
      name: 'Easy Route',
      stars: '2',
      style: 'Sport',
      order: 0,
      url: '/route/1447609059',
      points: '136.3 334.8,139 268,164.1 159.9 lower',
    },
  ])

  const areaTopoDataJson = JSON.stringify([
    {
      id: 1447648014,
      type: 'area',
      num: '',
      grade: '',
      class: '',
      zindex: '',
      name: 'Sargantana',
      stars: '',
      style: '',
      order: 0,
      url: '/area/1447648014',
      points: '80 31.1 lbvyd Sargantana,66.1 43,91.9 43,91.9 100,66.1 100',
    },
  ])

  test('should parse route annotation from topodata JSON', () => {
    // Act
    const annotations = TopoAnnotation.parseFromTopoDataJson(routeTopoDataJson)

    // Assert
    expect(annotations).toHaveLength(1)
    expect(annotations[0]).toBeInstanceOf(TopoAnnotation)
    expect(annotations[0].getType()).toBe('route')
  })

  test('should parse area annotation from topodata JSON', () => {
    // Act
    const annotations = TopoAnnotation.parseFromTopoDataJson(areaTopoDataJson)

    // Assert
    expect(annotations).toHaveLength(1)
    expect(annotations[0].getType()).toBe('area')
  })

  test('should get annotation id', () => {
    // Arrange
    const annotations = TopoAnnotation.parseFromTopoDataJson(routeTopoDataJson)

    // Act
    const id = annotations[0].getId()

    // Assert
    expect(id).toBe(1447609059)
  })

  test('should get path for route annotation', () => {
    // Arrange
    const annotations = TopoAnnotation.parseFromTopoDataJson(routeTopoDataJson)

    // Act
    const path = annotations[0].getPath()

    // Assert
    expect(path).not.toBeNull()
    expect(path?.getLength()).toBe(3)
    expect(path?.getStartPoint().getX()).toBe(136.3)
  })

  test('should get path for area annotation (polygon)', () => {
    // Arrange
    const annotations = TopoAnnotation.parseFromTopoDataJson(areaTopoDataJson)

    // Act
    const path = annotations[0].getPath()

    // Assert
    expect(path).not.toBeNull()
    expect(path?.getLength()).toBe(5)
  })

  test('should get grade for route annotation', () => {
    // Arrange
    const annotations = TopoAnnotation.parseFromTopoDataJson(routeTopoDataJson)

    // Act
    const grade = annotations[0].getGrade()

    // Assert
    expect(grade).not.toBeNull()
    expect(grade?.getGrade()).toBe('4')
    expect(grade?.getGradeClass()).toBe('gb1')
  })

  test('should get name and URL', () => {
    // Arrange
    const annotations = TopoAnnotation.parseFromTopoDataJson(routeTopoDataJson)

    // Act
    const name = annotations[0].getName()
    const url = annotations[0].getUrl()

    // Assert
    expect(name).toBe('Easy Route')
    expect(url).toBe('/route/1447609059')
  })

  test('should get route-specific properties', () => {
    // Arrange
    const annotations = TopoAnnotation.parseFromTopoDataJson(routeTopoDataJson)
    const annotation = annotations[0]

    // Assert
    expect(annotation.getStars()).toBe('2')
    expect(annotation.getStyle()).toBe('Sport')
    expect(annotation.getZindex()).toBe('1')
  })

  test('should get order and num', () => {
    // Arrange
    const annotations = TopoAnnotation.parseFromTopoDataJson(routeTopoDataJson)

    // Assert
    expect(annotations[0].getOrder()).toBe(0)
    expect(annotations[0].getNum()).toBe('1')
  })

  test('should check if annotation is route', () => {
    // Arrange
    const routeAnnotations =
      TopoAnnotation.parseFromTopoDataJson(routeTopoDataJson)
    const areaAnnotations =
      TopoAnnotation.parseFromTopoDataJson(areaTopoDataJson)

    // Assert
    expect(routeAnnotations[0].isRoute()).toBe(true)
    expect(routeAnnotations[0].isArea()).toBe(false)
    expect(areaAnnotations[0].isRoute()).toBe(false)
    expect(areaAnnotations[0].isArea()).toBe(true)
  })

  test('should parse multiple annotations from array', () => {
    // Arrange
    const multipleAnnotationsJson = JSON.stringify([
      {
        id: 1,
        type: 'route',
        num: '1',
        grade: '5a',
        class: 'gb2',
        zindex: '1',
        name: 'Route 1',
        stars: '1',
        style: 'Sport',
        order: 0,
        url: '/route/1',
        points: '100 200,150 250',
      },
      {
        id: 2,
        type: 'route',
        num: '2',
        grade: '6a',
        class: 'gb3',
        zindex: '2',
        name: 'Route 2',
        stars: '3',
        style: 'Trad',
        order: 1,
        url: '/route/2',
        points: '200 200,250 250',
      },
      {
        id: 3,
        type: 'area',
        num: '',
        grade: '',
        class: '',
        zindex: '',
        name: 'Sector A',
        stars: '',
        style: '',
        order: 2,
        url: '/area/3',
        points: '50 50 lbvyd Sector A,0 100,100 100,100 0,0 0',
      },
    ])

    // Act
    const annotations = TopoAnnotation.parseFromTopoDataJson(
      multipleAnnotationsJson,
    )

    // Assert
    expect(annotations).toHaveLength(3)
    expect(annotations[0].isRoute()).toBe(true)
    expect(annotations[1].isRoute()).toBe(true)
    expect(annotations[2].isArea()).toBe(true)
  })

  test('should handle annotation with label marker', () => {
    // Arrange
    const annotations = TopoAnnotation.parseFromTopoDataJson(areaTopoDataJson)
    const annotation = annotations[0]

    // Act
    const path = annotation.getPath()
    const labelPoint = path?.getLabelMarkerPoint()

    // Assert
    expect(labelPoint).not.toBeNull()
    expect(labelPoint?.getMarkerLabel()).toBe('Sargantana')
  })

  test('should return empty array for empty JSON array', () => {
    // Act
    const annotations = TopoAnnotation.parseFromTopoDataJson('[]')

    // Assert
    expect(annotations).toHaveLength(0)
  })

  test('should return null for grade when annotation is area type', () => {
    // Arrange
    const annotations = TopoAnnotation.parseFromTopoDataJson(areaTopoDataJson)

    // Act
    const grade = annotations[0].getGrade()

    // Assert
    expect(grade).toBeNull()
  })

  test('should get SVG path data from route annotation', () => {
    // Arrange
    const annotations = TopoAnnotation.parseFromTopoDataJson(routeTopoDataJson)

    // Act
    const svgPath = annotations[0].toSvgPathData()

    // Assert
    expect(svgPath).toBe('M 136.3 334.8 L 139 268 L 164.1 159.9')
  })

  test('should get polygon points from area annotation', () => {
    // Arrange
    const annotations = TopoAnnotation.parseFromTopoDataJson(areaTopoDataJson)

    // Act
    const polygonPoints = annotations[0].toPolygonPoints()

    // Assert
    expect(polygonPoints).toBe('80,31.1 66.1,43 91.9,43 91.9,100 66.1,100')
  })
})
