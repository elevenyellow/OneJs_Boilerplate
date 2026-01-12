import { describe, expect, test } from 'bun:test'
import { ScrapedRoute } from '../../entities/scraped-route.entity'
import { TopoImage } from '../../entities/topo-image.entity'
import { NodeId } from '../node-id.vo'
import { RouteGrade } from '../route-grade.vo'
import { RouteWithTopo } from '../route-with-topo.vo'
import { TopoAnnotation } from '../topo-annotation.vo'
import { TopoDimensions } from '../topo-dimensions.vo'
import { TopoId } from '../topo-id.vo'
import { TopoImageUrl } from '../topo-image-url.vo'

describe('RouteWithTopo Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create RouteWithTopo with route and topo annotation
  // 2. ✓ Create RouteWithTopo with route only (no topo annotation)
  // 3. ✓ Create RouteWithTopo with route and topo image reference
  // 4. ✓ Get route data from RouteWithTopo
  // 5. ✓ Get topo annotation from RouteWithTopo
  // 6. ✓ Get topo image from RouteWithTopo
  // 7. ✓ Check if RouteWithTopo has topo annotation
  // 8. ✓ Check if RouteWithTopo has topo image
  // 9. ✓ Link route with annotation by matching IDs
  // 10. ✓ Generate individual route SVG overlay

  const createMockRoute = (id: number, name: string): ScrapedRoute => {
    return ScrapedRoute.create(
      NodeId.create(id),
      name,
      name.toLowerCase().replace(/\s+/g, '-'),
      `https://www.thecrag.com/route/${id}`,
      RouteGrade.create('6a', 'gb3'),
      null,
      null,
      null,
      NodeId.create(1000),
      null,
      null,
    )
  }

  const createMockTopoAnnotation = (
    id: number,
    name: string,
    grade: string,
  ): TopoAnnotation => {
    // Points format: "x y,x y,x y" - each segment is "x y" separated by comma
    const rawData = `[{"id":${id},"type":"route","num":"1","name":"${name}","grade":"${grade}","class":"gb3","url":"/route/${id}","points":"100 100,150 80,200 60","stars":"3","style":"sport","order":1,"zindex":"1"}]`
    const annotations = TopoAnnotation.parseFromTopoDataJson(rawData)
    return annotations[0]
  }

  const createMockTopoImage = (topoIdStr: string): TopoImage => {
    const dimensions = TopoDimensions.fromDisplayWithScale(800, 600, 1)
    const topoId = TopoId.create(topoIdStr)
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    return TopoImage.create(topoId, dimensions, thumbnailUrl, fullImageUrl, [])
  }

  test('should create RouteWithTopo with route and topo annotation', () => {
    // Arrange
    const route = createMockRoute(12345, 'Test Route')
    const annotation = createMockTopoAnnotation(12345, 'Test Route', '6a')

    // Act
    const routeWithTopo = RouteWithTopo.create(route, annotation, null)

    // Assert
    expect(routeWithTopo).toBeInstanceOf(RouteWithTopo)
    expect(routeWithTopo.getRoute()).toBe(route)
    expect(routeWithTopo.getTopoAnnotation()).toBe(annotation)
  })

  test('should create RouteWithTopo with route only (no topo annotation)', () => {
    // Arrange
    const route = createMockRoute(12345, 'Test Route')

    // Act
    const routeWithTopo = RouteWithTopo.create(route, null, null)

    // Assert
    expect(routeWithTopo).toBeInstanceOf(RouteWithTopo)
    expect(routeWithTopo.getRoute()).toBe(route)
    expect(routeWithTopo.getTopoAnnotation()).toBeNull()
  })

  test('should create RouteWithTopo with route and topo image reference', () => {
    // Arrange
    const route = createMockRoute(12345, 'Test Route')
    const annotation = createMockTopoAnnotation(12345, 'Test Route', '6a')
    const topoImage = createMockTopoImage('topo-123')

    // Act
    const routeWithTopo = RouteWithTopo.create(route, annotation, topoImage)

    // Assert
    expect(routeWithTopo.getTopoImage()).toBe(topoImage)
  })

  test('should get route data from RouteWithTopo', () => {
    // Arrange
    const route = createMockRoute(12345, 'Test Route')
    const routeWithTopo = RouteWithTopo.create(route, null, null)

    // Act & Assert
    expect(routeWithTopo.getRouteId()).toEqual(route.getId())
    expect(routeWithTopo.getRouteName()).toBe('Test Route')
    expect(routeWithTopo.getRouteGrade()).toBe('6a')
  })

  test('should check if RouteWithTopo has topo annotation', () => {
    // Arrange
    const route = createMockRoute(12345, 'Test Route')
    const annotation = createMockTopoAnnotation(12345, 'Test Route', '6a')

    // Act
    const withAnnotation = RouteWithTopo.create(route, annotation, null)
    const withoutAnnotation = RouteWithTopo.create(route, null, null)

    // Assert
    expect(withAnnotation.hasTopoAnnotation()).toBe(true)
    expect(withoutAnnotation.hasTopoAnnotation()).toBe(false)
  })

  test('should check if RouteWithTopo has topo image', () => {
    // Arrange
    const route = createMockRoute(12345, 'Test Route')
    const topoImage = createMockTopoImage('topo-123')

    // Act
    const withImage = RouteWithTopo.create(route, null, topoImage)
    const withoutImage = RouteWithTopo.create(route, null, null)

    // Assert
    expect(withImage.hasTopoImage()).toBe(true)
    expect(withoutImage.hasTopoImage()).toBe(false)
  })

  test('should link route with annotation by matching IDs using static method', () => {
    // Arrange
    const route1 = createMockRoute(12345, 'Route 1')
    const route2 = createMockRoute(67890, 'Route 2')
    const route3 = createMockRoute(11111, 'Route 3 No Topo')

    const annotation1 = createMockTopoAnnotation(12345, 'Route 1', '6a')
    const annotation2 = createMockTopoAnnotation(67890, 'Route 2', '6b')

    const routes = [route1, route2, route3]
    const annotations = [annotation1, annotation2]

    // Act
    const routesWithTopos = RouteWithTopo.linkRoutesWithAnnotations(
      routes,
      annotations,
      null,
    )

    // Assert
    expect(routesWithTopos).toHaveLength(3)

    const linked1 = routesWithTopos.find(
      (r) => r.getRouteId().getValue() === 12345,
    )
    const linked2 = routesWithTopos.find(
      (r) => r.getRouteId().getValue() === 67890,
    )
    const linked3 = routesWithTopos.find(
      (r) => r.getRouteId().getValue() === 11111,
    )

    expect(linked1?.hasTopoAnnotation()).toBe(true)
    expect(linked2?.hasTopoAnnotation()).toBe(true)
    expect(linked3?.hasTopoAnnotation()).toBe(false)
  })

  test('should get SVG path data from topo annotation', () => {
    // Arrange
    const route = createMockRoute(12345, 'Test Route')
    const annotation = createMockTopoAnnotation(12345, 'Test Route', '6a')
    const routeWithTopo = RouteWithTopo.create(route, annotation, null)

    // Act
    const svgPath = routeWithTopo.getSvgPathData()

    // Assert
    expect(svgPath).toBeTruthy()
    expect(svgPath).toContain('M') // SVG path should start with M (moveto)
  })

  test('should return empty SVG path when no annotation', () => {
    // Arrange
    const route = createMockRoute(12345, 'Test Route')
    const routeWithTopo = RouteWithTopo.create(route, null, null)

    // Act
    const svgPath = routeWithTopo.getSvgPathData()

    // Assert
    expect(svgPath).toBe('')
  })
})
