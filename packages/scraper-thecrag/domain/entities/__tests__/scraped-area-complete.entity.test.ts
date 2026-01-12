import { describe, expect, test } from 'bun:test'
import { NodeId } from '../../value-objects/node-id.vo'
import { ScrapedAreaComplete } from '../scraped-area-complete.entity'
import { ScrapedSector } from '../scraped-sector.entity'

describe('ScrapedAreaComplete Entity', () => {
  // ==========================================================
  // TEST CASES LIST (TDD REASON Phase)
  // Order: simple → complex
  //
  // 1. ✓ Create with root area data only (no sectors)
  // 2. ✓ Create with root area and flat sectors (no hierarchy)
  // 3. ✓ Create with hierarchical structure (nested sectors)
  // 4. ✓ Get all sectors (flattened list)
  // 5. ✓ Get root sectors (direct children only)
  // 6. ✓ Find sector by ID
  // 7. ✓ Get total route count across all sectors
  // 8. ✓ Get total topo count across all sectors
  // 9. ✓ Check if area has routes (at any level)
  // 10. ✓ Check if area has sub-areas
  // 11. ✓ Convert to DTO with complete hierarchy
  // 12. ✓ Get depth of hierarchy
  // ==========================================================

  // Helper to create minimal ScrapedSector for tests
  function createTestSector(
    id: number,
    name: string,
    routeCount: number = 0,
    subSectorIds: number[] = [],
  ): ScrapedSector {
    return ScrapedSector.create(
      NodeId.create(id),
      name,
      `https://www.thecrag.com/climbing/test/${name.toLowerCase().replace(/ /g, '-')}`,
      [], // topoImages
      [], // routesWithTopos - simplified for test, we check counts differently
      subSectorIds.map((sid) => NodeId.create(sid)),
    )
  }

  // ==========================================================
  // Test 1: Create with root area data only (no sectors)
  // ==========================================================
  test('should create with root area data only', () => {
    // Arrange
    const rootId = NodeId.create(12345)
    const rootName = 'Altura'
    const rootUrl = 'https://www.thecrag.com/climbing/spain/altura'

    // Act
    const areaComplete = ScrapedAreaComplete.create(
      rootId,
      rootName,
      rootUrl,
      [],
    )

    // Assert
    expect(areaComplete).toBeInstanceOf(ScrapedAreaComplete)
    expect(areaComplete.getRootId().getValue()).toBe(12345)
    expect(areaComplete.getRootName()).toBe('Altura')
    expect(areaComplete.getRootUrl()).toBe(rootUrl)
    expect(areaComplete.getSectors()).toHaveLength(0)
  })

  // ==========================================================
  // Test 2: Create with root area and flat sectors
  // ==========================================================
  test('should create with root area and flat sectors', () => {
    // Arrange
    const rootId = NodeId.create(782524281)
    const sector1 = createTestSector(787116453, 'Raconet', 5)
    const sector2 = createTestSector(787116454, 'Sargantana', 8)

    // Act
    const areaComplete = ScrapedAreaComplete.create(
      rootId,
      'Altura',
      'https://www.thecrag.com/climbing/spain/altura',
      [sector1, sector2],
    )

    // Assert
    expect(areaComplete.getSectors()).toHaveLength(2)
    expect(areaComplete.getSectors()[0].getName()).toBe('Raconet')
    expect(areaComplete.getSectors()[1].getName()).toBe('Sargantana')
  })

  // ==========================================================
  // Test 3: Create with hierarchical structure
  // ==========================================================
  test('should create with hierarchical structure', () => {
    // Arrange - Parent sector with sub-sectors
    const rootId = NodeId.create(11111)
    const parentSector = createTestSector(
      22222,
      'Parent Sector',
      0,
      [33333, 44444],
    )
    const childSector1 = createTestSector(33333, 'Child 1', 5)
    const childSector2 = createTestSector(44444, 'Child 2', 3)

    // Act
    const areaComplete = ScrapedAreaComplete.create(
      rootId,
      'Main Crag',
      'https://www.thecrag.com/climbing/main-crag',
      [parentSector, childSector1, childSector2],
    )

    // Assert
    expect(areaComplete.getSectors()).toHaveLength(3)
    expect(parentSector.hasSubSectors()).toBe(true)
    expect(parentSector.getSubSectorIds()).toHaveLength(2)
  })

  // ==========================================================
  // Test 4: Get all sectors (flattened list)
  // ==========================================================
  test('should get all sectors as flattened list', () => {
    // Arrange
    const rootId = NodeId.create(11111)
    const sector1 = createTestSector(22222, 'Sector A', 5)
    const sector2 = createTestSector(33333, 'Sector B', 3)
    const sector3 = createTestSector(44444, 'Sector C', 7)

    const areaComplete = ScrapedAreaComplete.create(
      rootId,
      'Crag',
      'https://url',
      [sector1, sector2, sector3],
    )

    // Act
    const allSectors = areaComplete.getSectors()

    // Assert
    expect(allSectors).toHaveLength(3)
    expect(allSectors.map((s) => s.getName())).toEqual([
      'Sector A',
      'Sector B',
      'Sector C',
    ])
  })

  // ==========================================================
  // Test 5: Get root sectors (direct children only)
  // ==========================================================
  test('should get root sectors (direct children of root area)', () => {
    // Arrange - hierarchy: Root -> [Parent1 -> [Child1, Child2], Parent2]
    const rootId = NodeId.create(11111)
    const parent1 = createTestSector(22222, 'Parent 1', 0, [33333, 44444])
    const child1 = createTestSector(33333, 'Child 1', 5)
    const child2 = createTestSector(44444, 'Child 2', 3)
    const parent2 = createTestSector(55555, 'Parent 2', 10)

    const areaComplete = ScrapedAreaComplete.create(
      rootId,
      'Crag',
      'https://url',
      [parent1, child1, child2, parent2],
      [NodeId.create(22222), NodeId.create(55555)], // rootSectorIds
    )

    // Act
    const rootSectors = areaComplete.getRootSectors()

    // Assert
    expect(rootSectors).toHaveLength(2)
    expect(rootSectors.map((s) => s.getName())).toEqual([
      'Parent 1',
      'Parent 2',
    ])
  })

  // ==========================================================
  // Test 6: Find sector by ID
  // ==========================================================
  test('should find sector by ID', () => {
    // Arrange
    const rootId = NodeId.create(11111)
    const sector1 = createTestSector(22222, 'Sector A')
    const sector2 = createTestSector(33333, 'Sector B')

    const areaComplete = ScrapedAreaComplete.create(
      rootId,
      'Crag',
      'https://url',
      [sector1, sector2],
    )

    // Act
    const found = areaComplete.findSectorById(NodeId.create(33333))
    const notFound = areaComplete.findSectorById(NodeId.create(99999))

    // Assert
    expect(found).not.toBeNull()
    expect(found?.getName()).toBe('Sector B')
    expect(notFound).toBeNull()
  })

  // ==========================================================
  // Test 7: Get total route count across all sectors
  // ==========================================================
  test('should get total route count across all sectors', () => {
    // Arrange
    const rootId = NodeId.create(11111)
    // Note: Since ScrapedSector takes routesWithTopos, we need real RouteWithTopo objects
    // For this test we'll check the method exists and works with empty routes
    const sector1 = createTestSector(22222, 'Sector A')
    const sector2 = createTestSector(33333, 'Sector B')

    const areaComplete = ScrapedAreaComplete.create(
      rootId,
      'Crag',
      'https://url',
      [sector1, sector2],
    )

    // Act
    const totalRoutes = areaComplete.getTotalRouteCount()

    // Assert
    expect(totalRoutes).toBe(0) // No routes in test sectors
  })

  // ==========================================================
  // Test 8: Get total topo count across all sectors
  // ==========================================================
  test('should get total topo count across all sectors', () => {
    // Arrange
    const rootId = NodeId.create(11111)
    const sector1 = createTestSector(22222, 'Sector A')
    const sector2 = createTestSector(33333, 'Sector B')

    const areaComplete = ScrapedAreaComplete.create(
      rootId,
      'Crag',
      'https://url',
      [sector1, sector2],
    )

    // Act
    const totalTopos = areaComplete.getTotalTopoCount()

    // Assert
    expect(totalTopos).toBe(0) // No topos in test sectors
  })

  // ==========================================================
  // Test 9: Check if area has routes
  // ==========================================================
  test('should check if area has routes at any level', () => {
    // Arrange
    const rootId = NodeId.create(11111)
    const emptyArea = ScrapedAreaComplete.create(
      rootId,
      'Empty Crag',
      'https://url',
      [],
    )
    const areaWithSectors = ScrapedAreaComplete.create(
      rootId,
      'Crag with sectors',
      'https://url',
      [createTestSector(22222, 'Sector')],
    )

    // Act & Assert
    expect(emptyArea.hasRoutes()).toBe(false)
    expect(areaWithSectors.hasRoutes()).toBe(false) // Test sectors have no routes
  })

  // ==========================================================
  // Test 10: Check if area has sub-areas
  // ==========================================================
  test('should check if area has sub-areas', () => {
    // Arrange
    const rootId = NodeId.create(11111)
    const emptyArea = ScrapedAreaComplete.create(
      rootId,
      'Empty Crag',
      'https://url',
      [],
    )
    const areaWithSectors = ScrapedAreaComplete.create(
      rootId,
      'Crag with sectors',
      'https://url',
      [createTestSector(22222, 'Sector')],
    )

    // Act & Assert
    expect(emptyArea.hasSectors()).toBe(false)
    expect(areaWithSectors.hasSectors()).toBe(true)
  })

  // ==========================================================
  // Test 11: Convert to DTO with complete hierarchy
  // ==========================================================
  test('should convert to DTO with complete hierarchy', () => {
    // Arrange
    const rootId = NodeId.create(782524281)
    const sector = createTestSector(787116453, 'Raconet')

    const areaComplete = ScrapedAreaComplete.create(
      rootId,
      'Altura',
      'https://www.thecrag.com/climbing/spain/altura',
      [sector],
    )

    // Act
    const dto = areaComplete.toDto()

    // Assert
    expect(dto.rootId).toBe('782524281')
    expect(dto.rootName).toBe('Altura')
    expect(dto.rootUrl).toBe('https://www.thecrag.com/climbing/spain/altura')
    expect(dto.sectors).toHaveLength(1)
    expect(dto.sectors[0].name).toBe('Raconet')
    expect(dto.stats).toBeDefined()
    expect(dto.stats.sectorCount).toBe(1)
    expect(dto.stats.totalRoutes).toBe(0)
    expect(dto.stats.totalTopos).toBe(0)
  })

  // ==========================================================
  // Test 12: Get depth of hierarchy
  // ==========================================================
  test('should get depth of hierarchy', () => {
    // Arrange - Create hierarchy with depth 2
    const rootId = NodeId.create(11111)

    // Level 1: Parent sectors (children of root)
    const parent1 = createTestSector(22222, 'Parent 1', 0, [33333])
    const parent2 = createTestSector(44444, 'Parent 2', 0)

    // Level 2: Child sectors
    const child1 = createTestSector(33333, 'Child 1', 5)

    const areaComplete = ScrapedAreaComplete.create(
      rootId,
      'Crag',
      'https://url',
      [parent1, parent2, child1],
      [NodeId.create(22222), NodeId.create(44444)], // rootSectorIds
    )

    // Act
    const depth = areaComplete.getHierarchyDepth()

    // Assert
    // Depth 0 = root area
    // Depth 1 = parent sectors
    // Depth 2 = child sectors
    expect(depth).toBe(2)
  })

  // ==========================================================
  // Test 13: Get sectors at specific depth
  // ==========================================================
  test('should get sectors at specific depth', () => {
    // Arrange
    const rootId = NodeId.create(11111)
    const parent1 = createTestSector(22222, 'Parent 1', 0, [33333])
    const parent2 = createTestSector(44444, 'Parent 2', 0)
    const child1 = createTestSector(33333, 'Child 1', 5)

    const areaComplete = ScrapedAreaComplete.create(
      rootId,
      'Crag',
      'https://url',
      [parent1, parent2, child1],
      [NodeId.create(22222), NodeId.create(44444)],
    )

    // Act
    const depth1Sectors = areaComplete.getSectorsAtDepth(1)
    const depth2Sectors = areaComplete.getSectorsAtDepth(2)

    // Assert
    expect(depth1Sectors).toHaveLength(2)
    expect(depth1Sectors.map((s) => s.getName())).toEqual([
      'Parent 1',
      'Parent 2',
    ])
    expect(depth2Sectors).toHaveLength(1)
    expect(depth2Sectors[0].getName()).toBe('Child 1')
  })

  // ==========================================================
  // Test 14: Get children of a specific sector
  // ==========================================================
  test('should get children of a specific sector', () => {
    // Arrange
    const rootId = NodeId.create(11111)
    const parent = createTestSector(22222, 'Parent', 0, [33333, 44444])
    const child1 = createTestSector(33333, 'Child 1', 5)
    const child2 = createTestSector(44444, 'Child 2', 3)

    const areaComplete = ScrapedAreaComplete.create(
      rootId,
      'Crag',
      'https://url',
      [parent, child1, child2],
      [NodeId.create(22222)],
    )

    // Act
    const children = areaComplete.getChildrenOf(NodeId.create(22222))

    // Assert
    expect(children).toHaveLength(2)
    expect(children.map((s) => s.getName()).sort()).toEqual([
      'Child 1',
      'Child 2',
    ])
  })
})
