import { describe, expect, test } from 'bun:test'
import { NodeId } from '../node-id.vo'
import { SectorPath } from '../sector-path.vo'

describe('SectorPath Value Object', () => {
  // TEST CASES LIST (REASON)
  // 1. ✓ Build path with urlStub only
  // 2. ✓ Build path with urlStub and urlAncestorStub
  // 3. ✓ Build path with urlAncestorStub only (fallback)
  // 4. ✓ Build path with nodeId only (last resort fallback)
  // 5. ✓ Handle urlStub starting with /
  // 6. ✓ Get full URL
  // 7. ✓ Get path value
  // 8. ✓ Equals comparison
  // 9. ✓ Convert to string

  test('should build path with urlStub only', () => {
    const nodeId = NodeId.createFrom(12345)
    const path = SectorPath.build(nodeId, 'spain/valencia/cheste', undefined)

    expect(path.getValue()).toBe('/en/climbing/spain/valencia/cheste')
  })

  test('should build path with urlStub and urlAncestorStub', () => {
    const nodeId = NodeId.createFrom(12345)
    const path = SectorPath.build(nodeId, 'sector-a', 'spain/valencia')

    expect(path.getValue()).toBe('/en/climbing/spain/valencia/sector-a')
  })

  test('should build path with urlAncestorStub only (fallback)', () => {
    const nodeId = NodeId.createFrom(12345)
    const path = SectorPath.build(nodeId, undefined, 'spain/valencia')

    expect(path.getValue()).toBe('/en/climbing/spain/valencia/area/12345')
  })

  test('should build path with nodeId only (last resort fallback)', () => {
    const nodeId = NodeId.createFrom(12345)
    const path = SectorPath.build(nodeId, undefined, undefined)

    expect(path.getValue()).toBe('/en/climbing/area/12345')
  })

  test('should handle urlStub starting with /', () => {
    const nodeId = NodeId.createFrom(12345)
    const path = SectorPath.build(nodeId, '/sector-a', 'spain/valencia')

    expect(path.getValue()).toBe('/en/climbing/spain/valencia/sector-a')
  })

  test('should get full URL', () => {
    const nodeId = NodeId.createFrom(12345)
    const path = SectorPath.build(nodeId, 'spain/valencia/cheste', undefined)

    expect(path.getFullUrl()).toBe(
      'https://www.thecrag.com/en/climbing/spain/valencia/cheste',
    )
  })

  test('should get path value', () => {
    const nodeId = NodeId.createFrom(12345)
    const path = SectorPath.build(nodeId, 'test-sector', undefined)

    expect(path.getValue()).toBe('/en/climbing/test-sector')
  })

  test('should compare two paths for equality', () => {
    const nodeId = NodeId.createFrom(12345)
    const path1 = SectorPath.build(nodeId, 'sector-a', undefined)
    const path2 = SectorPath.build(nodeId, 'sector-a', undefined)
    const path3 = SectorPath.build(nodeId, 'sector-b', undefined)

    expect(path1.equals(path2)).toBe(true)
    expect(path1.equals(path3)).toBe(false)
  })

  test('should convert to string', () => {
    const nodeId = NodeId.createFrom(12345)
    const path = SectorPath.build(nodeId, 'test-sector', undefined)

    expect(path.toString()).toBe('/en/climbing/test-sector')
  })
})
