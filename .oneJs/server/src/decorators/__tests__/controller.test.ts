import { describe, test, expect, mock, beforeEach } from 'bun:test'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockRegisterService = mock(() => {})
const mockMarkAs = mock(() => {})
const mockRegisterController = mock(() => {})

mock.module('@OneJs/core', () => ({
  metadataRegistry: { registerService: mockRegisterService },
  markAs: mockMarkAs,
}))

mock.module('../../controller-registry', () => ({
  registerController: mockRegisterController,
}))

const { Controller } = await import('../controller')
const { getControllerMeta } = await import('../../utils/route-metadata')

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Controller decorator', () => {
  beforeEach(() => {
    mockRegisterService.mockClear()
    mockMarkAs.mockClear()
    mockRegisterController.mockClear()
  })

  test('sets the path on controller metadata', () => {
    @Controller('/users')
    class UserController {}

    const meta = getControllerMeta(UserController as any)
    expect(meta.path).toBe('/users')
  })

  test('sets the version on controller metadata when provided', () => {
    @Controller('/products', 'v2')
    class ProductController {}

    const meta = getControllerMeta(ProductController as any)
    expect(meta.version).toBe('v2')
  })

  test('does not set version when not provided', () => {
    @Controller('/orders')
    class OrderController {}

    const meta = getControllerMeta(OrderController as any)
    expect(meta.version).toBeUndefined()
  })

  test('registers the class as a singleton service', () => {
    @Controller('/items')
    class ItemController {}

    expect(mockRegisterService).toHaveBeenCalledTimes(1)
    const [ctor, scope, lazy] = mockRegisterService.mock.calls[0] as any
    expect(ctor).toBe(ItemController)
    expect(scope).toBe('singleton')
    expect(lazy).toBe(false)
  })

  test('marks the class as controller role', () => {
    @Controller('/tasks')
    class TaskController {}

    expect(mockMarkAs).toHaveBeenCalledWith(TaskController, 'controller')
  })

  test('calls registerController with the class', () => {
    @Controller('/invoices')
    class InvoiceController {}

    expect(mockRegisterController).toHaveBeenCalledTimes(1)
    expect(mockRegisterController.mock.calls[0][0]).toBe(InvoiceController)
  })
})
