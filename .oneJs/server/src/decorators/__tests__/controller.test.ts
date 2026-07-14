import { clearMarkers, getRoles, metadataRegistry } from '@OneJs/core'
import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { clearControllers, getAllControllers } from '../../controller-registry'
import { getControllerMeta } from '../../utils/route-metadata'
import { Controller } from '../controller'

void mock

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Controller decorator', () => {
  beforeEach(() => {
    clearControllers()
    clearMarkers()
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

    const metadata = metadataRegistry.getMetadata(ItemController)
    expect(metadata?.scope).toBe('singleton')
    expect(metadata?.autorun).toBe(false)
  })

  test('marks the class as controller role', () => {
    @Controller('/tasks')
    class TaskController {}

    expect(getRoles(TaskController)).toContain('controller')
  })

  test('calls registerController with the class', () => {
    @Controller('/invoices')
    class InvoiceController {}

    expect(getAllControllers()).toContain(InvoiceController)
  })
})
