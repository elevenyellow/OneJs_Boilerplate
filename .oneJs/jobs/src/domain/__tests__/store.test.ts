import { describe, expect, test } from 'bun:test'
import { getAllWorkerHandlers, registerWorkerHandler } from '../store'

class HandlerA {}
class HandlerB {}

describe('Worker handler store', () => {
  test('starts empty in a fresh module', () => {
    expect(getAllWorkerHandlers()).toHaveLength(0)
  })

  test('registerWorkerHandler adds an entry', () => {
    const before = getAllWorkerHandlers().length

    registerWorkerHandler({
      target: HandlerA,
      methodName: 'process',
      queueName: 'emails',
      concurrency: 1,
    })

    expect(getAllWorkerHandlers()).toHaveLength(before + 1)
  })

  test('registered entry has correct fields', () => {
    const handlers = getAllWorkerHandlers()
    const entry = handlers.find(
      (h) => h.target === HandlerA && h.queueName === 'emails',
    )

    expect(entry).toBeDefined()
    expect(entry!.methodName).toBe('process')
    expect(entry!.concurrency).toBe(1)
  })

  test('accumulates multiple handlers', () => {
    const before = getAllWorkerHandlers().length

    registerWorkerHandler({
      target: HandlerB,
      methodName: 'send',
      queueName: 'sms',
      concurrency: 5,
    })

    expect(getAllWorkerHandlers()).toHaveLength(before + 1)
  })

  test('getAllWorkerHandlers returns all registered entries', () => {
    const all = getAllWorkerHandlers()
    const queueNames = all.map((h) => h.queueName)

    expect(queueNames).toContain('emails')
    expect(queueNames).toContain('sms')
  })

  test('second handler has correct concurrency', () => {
    const smsHandler = getAllWorkerHandlers().find((h) => h.queueName === 'sms')

    expect(smsHandler!.concurrency).toBe(5)
    expect(smsHandler!.methodName).toBe('send')
    expect(smsHandler!.target).toBe(HandlerB)
  })
})
