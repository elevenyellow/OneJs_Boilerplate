import { beforeEach, describe, expect, test } from 'bun:test'
import { ProxyManager } from '../ProxyManager'

describe('ProxyManager Singleton', () => {
  // TEST CASES LIST (REASON phase)
  // 1. ✓ Should return same instance when getInstance called multiple times
  // 2. ✓ Should share state between multiple getInstance calls
  // 3. ✓ Should allow resetting instance
  // 4. ✓ Should create new instance after reset
  // 5. ✓ Should use configuration from first getInstance call

  beforeEach(() => {
    // Reset singleton before each test to ensure isolation
    ProxyManager.resetInstance()
  })

  // RED phase - Test 1
  test('should return the same instance when getInstance called multiple times', () => {
    // Arrange & Act
    const instance1 = ProxyManager.getInstance()
    const instance2 = ProxyManager.getInstance()

    // Assert
    expect(instance1).toBe(instance2)
  })

  // RED phase - Test 2
  test('should share state between multiple getInstance calls', () => {
    // Arrange
    const instance1 = ProxyManager.getInstance()
    const proxy = instance1.getNext()

    // Act
    if (proxy) {
      instance1.reportFailure(proxy)
    }

    const instance2 = ProxyManager.getInstance()
    const stats = instance2.getStats()

    // Assert
    expect(stats.total).toBeGreaterThan(0)
    // Both instances should see the same total count
    expect(instance1.getStats().total).toBe(instance2.getStats().total)
  })

  // RED phase - Test 3
  test('should allow resetting instance', () => {
    // Arrange
    const instance1 = ProxyManager.getInstance()
    expect(instance1).toBeDefined()

    // Act
    ProxyManager.resetInstance()

    // Assert - After reset, getInstance should create a new instance
    const instance2 = ProxyManager.getInstance()
    expect(instance2).toBeDefined()
    // Note: We can't directly compare instances after reset as the old one is cleared
  })

  // RED phase - Test 4
  test('should create new instance after reset', () => {
    // Arrange
    const instance1 = ProxyManager.getInstance()
    const proxy1 = instance1.getNext()
    if (proxy1) {
      instance1.reportFailure(proxy1)
      instance1.reportFailure(proxy1)
    }

    // Act
    ProxyManager.resetInstance()
    const instance2 = ProxyManager.getInstance()

    // Assert - New instance should have fresh state
    const stats = instance2.getStats()
    expect(stats.total).toBeGreaterThan(0)
    // All proxies should be enabled in fresh instance (none disabled)
    expect(stats.disabled).toBe(0)
  })

  // RED phase - Test 5
  test('should use configuration from first getInstance call', () => {
    // Arrange & Act
    const instance1 = ProxyManager.getInstance({
      maxFailures: 3,
      cooldownMs: 30000,
    })

    // Second call with different config should return same instance
    const instance2 = ProxyManager.getInstance({
      maxFailures: 10,
      cooldownMs: 90000,
    })

    // Assert
    expect(instance1).toBe(instance2)
    // Configuration should be from first call
    // We can't directly access maxFailures, but we can test behavior
    const proxy = instance1.getNext()
    if (proxy) {
      // Report 3 failures (maxFailures from first call)
      instance1.reportFailure(proxy)
      instance1.reportFailure(proxy)
      instance1.reportFailure(proxy)

      // After 3 failures, proxy should be disabled
      const stats = instance1.getStats()
      expect(stats.disabled).toBe(1)
    }
  })
})

describe('ProxyManager - Existing functionality', () => {
  beforeEach(() => {
    ProxyManager.resetInstance()
  })

  test('should have proxies configured', () => {
    // Arrange & Act
    const manager = ProxyManager.getInstance()

    // Assert
    expect(manager.hasProxies()).toBe(true)
    const stats = manager.getStats()
    expect(stats.total).toBeGreaterThan(0)
  })

  test('should return next available proxy', () => {
    // Arrange
    const manager = ProxyManager.getInstance()

    // Act
    const proxy = manager.getNext()

    // Assert
    expect(proxy).not.toBeNull()
    expect(proxy?.host).toBeDefined()
    expect(proxy?.port).toBeDefined()
  })

  test('should track proxy failures', () => {
    // Arrange
    const manager = ProxyManager.getInstance()
    const proxy = manager.getNext()

    // Act
    if (proxy) {
      manager.reportFailure(proxy)
    }

    // Assert
    expect(proxy?.failures).toBe(1)
  })

  test('should reset failures on success', () => {
    // Arrange
    const manager = ProxyManager.getInstance()
    const proxy = manager.getNext()

    // Act
    if (proxy) {
      manager.reportFailure(proxy)
      expect(proxy.failures).toBe(1)

      manager.reportSuccess(proxy)
    }

    // Assert
    expect(proxy?.failures).toBe(0)
  })
})
