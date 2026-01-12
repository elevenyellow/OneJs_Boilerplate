import { describe, expect, test } from 'bun:test'
import { ScrapedRoute } from '../scraped-route.entity'
import { ScrapedSector } from '../scraped-sector.entity'
import { TopoImage } from '../topo-image.entity'
import { NodeId } from '../../value-objects/node-id.vo'
import { RouteGrade } from '../../value-objects/route-grade.vo'
import { RouteWithTopo } from '../../value-objects/route-with-topo.vo'
import { TopoAnnotation } from '../../value-objects/topo-annotation.vo'
import { TopoDimensions } from '../../value-objects/topo-dimensions.vo'
import { TopoId } from '../../value-objects/topo-id.vo'
import { TopoImageUrl } from '../../value-objects/topo-image-url.vo'

describe('ScrapedSector Entity', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Create ScrapedSector with basic data
  // 2. ✓ Create ScrapedSector with topos and routes
  // 3. ✓ Get sector topo images (panoramic views)
  // 4. ✓ Get all routes with their topo annotations
  // 5. ✓ Get routes that have topo annotations
  // 6. ✓ Get routes without topo annotations
  // 7. ✓ Get sub-sectors (child areas that are not routes)
  // 8. ✓ Check if sector has routes
  // 9. ✓ Check if sector has topos
  // 10. ✓ Get total route count
  // 11. ✓ Create ScrapedSector from ScrapedArea and routes

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

  const createMockTopoImage = (
    topoIdStr: string,
    routeAnnotations: Array<{ id: number; name: string; grade: string }>,
  ): TopoImage => {
    const dimensions = TopoDimensions.fromDisplayWithScale(800, 600, 1)
    const annotationsJson = JSON.stringify(
      routeAnnotations.map((r) => ({
        id: r.id,
        type: 'route',
        num: '1',
        name: r.name,
        grade: r.grade,
        class: 'gb3',
        url: `/route/${r.id}`,
        points: '100 100,150 80,200 60',
        stars: '3',
        style: 'sport',
        order: 1,
        zindex: '1',
      })),
    )
    const annotations = TopoAnnotation.parseFromTopoDataJson(annotationsJson)
    const topoId = TopoId.create(topoIdStr)
    const thumbnailUrl = TopoImageUrl.create('https://example.com/thumb.jpg')
    const fullImageUrl = TopoImageUrl.create('https://example.com/full.jpg')
    return TopoImage.create(
      topoId,
      dimensions,
      thumbnailUrl,
      fullImageUrl,
      annotations,
    )
  }

  const createMockSectorTopoImage = (
    topoIdStr: string,
    areaAnnotations: Array<{ id: number; name: string }>,
  ): TopoImage => {
    const dimensions = TopoDimensions.fromDisplayWithScale(800, 600, 1)
    const annotationsJson = JSON.stringify(
      areaAnnotations.map((a) => ({
        id: a.id,
        type: 'annotation',
        num: '',
        name: a.name,
        grade: '',
        class: '',
        url: `/area/${a.id}`,
        points: '100 100,200 100,200 200,100 200',
        stars: '',
        style: '',
        order: 1,
        zindex: '1',
      })),
    )
    const annotations = TopoAnnotation.parseFromTopoDataJson(annotationsJson)
    const topoId = TopoId.create(topoIdStr)
    const thumbnailUrl = TopoImageUrl.create(
      'https://example.com/sector-thumb.jpg',
    )
    const fullImageUrl = TopoImageUrl.create(
      'https://example.com/sector-full.jpg',
    )
    return TopoImage.create(
      topoId,
      dimensions,
      thumbnailUrl,
      fullImageUrl,
      annotations,
    )
  }

  test('should create ScrapedSector with basic data', () => {
    // Arrange
    const sectorId = NodeId.create(12345)
    const name = 'Test Sector'
    const url = 'https://www.thecrag.com/area/12345'

    // Act
    const sector = ScrapedSector.create(sectorId, name, url, [], [], [])

    // Assert
    expect(sector).toBeInstanceOf(ScrapedSector)
    expect(sector.getId()).toEqual(sectorId)
    expect(sector.getName()).toBe(name)
    expect(sector.getUrl()).toBe(url)
  })

  test('should create ScrapedSector with topos and routes', () => {
    // Arrange
    const sectorId = NodeId.create(12345)
    const route1 = createMockRoute(111, 'Route 1')
    const route2 = createMockRoute(222, 'Route 2')

    const topoImage = createMockTopoImage('topo-1', [
      { id: 111, name: 'Route 1', grade: '6a' },
      { id: 222, name: 'Route 2', grade: '6b' },
    ])

    const routesWithTopos = RouteWithTopo.linkRoutesWithAnnotations(
      [route1, route2],
      topoImage.getRouteAnnotations(),
      topoImage,
    )

    // Act
    const sector = ScrapedSector.create(
      sectorId,
      'Test Sector',
      'https://www.thecrag.com/area/12345',
      [topoImage],
      routesWithTopos,
      [],
    )

    // Assert
    expect(sector.getTopoImages()).toHaveLength(1)
    expect(sector.getRoutesWithTopos()).toHaveLength(2)
  })

  test('should get sector topo images (panoramic views)', () => {
    // Arrange
    const sectorTopo = createMockSectorTopoImage('sector-topo', [
      { id: 1, name: 'Izquierda' },
      { id: 2, name: 'Derecha' },
    ])
    const routeTopo = createMockTopoImage('route-topo', [
      { id: 111, name: 'Route 1', grade: '6a' },
    ])

    const sector = ScrapedSector.create(
      NodeId.create(12345),
      'Test Sector',
      'https://www.thecrag.com/area/12345',
      [sectorTopo, routeTopo],
      [],
      [],
    )

    // Act
    const allTopos = sector.getTopoImages()

    // Assert
    expect(allTopos).toHaveLength(2)
  })

  test('should get all routes with their topo annotations', () => {
    // Arrange
    const route1 = createMockRoute(111, 'Route 1')
    const route2 = createMockRoute(222, 'Route 2')
    const route3 = createMockRoute(333, 'Route 3 No Topo')

    const topoImage = createMockTopoImage('topo-1', [
      { id: 111, name: 'Route 1', grade: '6a' },
      { id: 222, name: 'Route 2', grade: '6b' },
    ])

    const routesWithTopos = RouteWithTopo.linkRoutesWithAnnotations(
      [route1, route2, route3],
      topoImage.getRouteAnnotations(),
      topoImage,
    )

    const sector = ScrapedSector.create(
      NodeId.create(12345),
      'Test Sector',
      'https://www.thecrag.com/area/12345',
      [topoImage],
      routesWithTopos,
      [],
    )

    // Act
    const allRoutes = sector.getRoutesWithTopos()

    // Assert
    expect(allRoutes).toHaveLength(3)
  })

  test('should get routes that have topo annotations', () => {
    // Arrange
    const route1 = createMockRoute(111, 'Route 1')
    const route2 = createMockRoute(222, 'Route 2')
    const route3 = createMockRoute(333, 'Route 3 No Topo')

    const topoImage = createMockTopoImage('topo-1', [
      { id: 111, name: 'Route 1', grade: '6a' },
      { id: 222, name: 'Route 2', grade: '6b' },
    ])

    const routesWithTopos = RouteWithTopo.linkRoutesWithAnnotations(
      [route1, route2, route3],
      topoImage.getRouteAnnotations(),
      topoImage,
    )

    const sector = ScrapedSector.create(
      NodeId.create(12345),
      'Test Sector',
      'https://www.thecrag.com/area/12345',
      [topoImage],
      routesWithTopos,
      [],
    )

    // Act
    const routesWithAnnotations = sector.getRoutesWithAnnotations()

    // Assert
    expect(routesWithAnnotations).toHaveLength(2)
    expect(routesWithAnnotations.every((r) => r.hasTopoAnnotation())).toBe(true)
  })

  test('should get routes without topo annotations', () => {
    // Arrange
    const route1 = createMockRoute(111, 'Route 1')
    const route2 = createMockRoute(333, 'Route Without Topo')

    const topoImage = createMockTopoImage('topo-1', [
      { id: 111, name: 'Route 1', grade: '6a' },
    ])

    const routesWithTopos = RouteWithTopo.linkRoutesWithAnnotations(
      [route1, route2],
      topoImage.getRouteAnnotations(),
      topoImage,
    )

    const sector = ScrapedSector.create(
      NodeId.create(12345),
      'Test Sector',
      'https://www.thecrag.com/area/12345',
      [topoImage],
      routesWithTopos,
      [],
    )

    // Act
    const routesWithoutAnnotations = sector.getRoutesWithoutAnnotations()

    // Assert
    expect(routesWithoutAnnotations).toHaveLength(1)
    expect(routesWithoutAnnotations[0].getRouteName()).toBe(
      'Route Without Topo',
    )
  })

  test('should get sub-sectors (child areas)', () => {
    // Arrange
    const subSectorIds = [NodeId.create(100), NodeId.create(200)]

    const sector = ScrapedSector.create(
      NodeId.create(12345),
      'Test Sector',
      'https://www.thecrag.com/area/12345',
      [],
      [],
      subSectorIds,
    )

    // Act
    const subSectors = sector.getSubSectorIds()

    // Assert
    expect(subSectors).toHaveLength(2)
    expect(subSectors[0].getValue()).toBe(100)
    expect(subSectors[1].getValue()).toBe(200)
  })

  test('should check if sector has routes', () => {
    // Arrange
    const route = createMockRoute(111, 'Route 1')
    const routeWithTopo = RouteWithTopo.create(route, null, null)

    const sectorWithRoutes = ScrapedSector.create(
      NodeId.create(12345),
      'Sector With Routes',
      'https://www.thecrag.com/area/12345',
      [],
      [routeWithTopo],
      [],
    )

    const sectorWithoutRoutes = ScrapedSector.create(
      NodeId.create(67890),
      'Sector Without Routes',
      'https://www.thecrag.com/area/67890',
      [],
      [],
      [],
    )

    // Assert
    expect(sectorWithRoutes.hasRoutes()).toBe(true)
    expect(sectorWithoutRoutes.hasRoutes()).toBe(false)
  })

  test('should check if sector has topos', () => {
    // Arrange
    const topoImage = createMockTopoImage('topo-1', [])

    const sectorWithTopos = ScrapedSector.create(
      NodeId.create(12345),
      'Sector With Topos',
      'https://www.thecrag.com/area/12345',
      [topoImage],
      [],
      [],
    )

    const sectorWithoutTopos = ScrapedSector.create(
      NodeId.create(67890),
      'Sector Without Topos',
      'https://www.thecrag.com/area/67890',
      [],
      [],
      [],
    )

    // Assert
    expect(sectorWithTopos.hasTopos()).toBe(true)
    expect(sectorWithoutTopos.hasTopos()).toBe(false)
  })

  test('should get total route count', () => {
    // Arrange
    const routes = [
      createMockRoute(111, 'Route 1'),
      createMockRoute(222, 'Route 2'),
      createMockRoute(333, 'Route 3'),
    ]
    const routesWithTopos = routes.map((r) =>
      RouteWithTopo.create(r, null, null),
    )

    const sector = ScrapedSector.create(
      NodeId.create(12345),
      'Test Sector',
      'https://www.thecrag.com/area/12345',
      [],
      routesWithTopos,
      [],
    )

    // Act & Assert
    expect(sector.getRouteCount()).toBe(3)
  })

  test('should check if sector has sub-sectors', () => {
    // Arrange
    const sectorWithSubSectors = ScrapedSector.create(
      NodeId.create(12345),
      'Sector With SubSectors',
      'https://www.thecrag.com/area/12345',
      [],
      [],
      [NodeId.create(100)],
    )

    const sectorWithoutSubSectors = ScrapedSector.create(
      NodeId.create(67890),
      'Sector Without SubSectors',
      'https://www.thecrag.com/area/67890',
      [],
      [],
      [],
    )

    // Assert
    expect(sectorWithSubSectors.hasSubSectors()).toBe(true)
    expect(sectorWithoutSubSectors.hasSubSectors()).toBe(false)
  })
})
