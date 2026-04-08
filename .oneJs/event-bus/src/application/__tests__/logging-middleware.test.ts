import { describe, expect, it, mock } from 'bun:test'
import { LoggingMiddleware } from '.././logging-middleware'
import { DomainEvent } from '../../domain/events/domain-events'

class SampleEvent extends DomainEvent {
  constructor() { super() }
}

describe('LoggingMiddleware', () => {
  it('calls next() and completes without error', async () => {
    const event = new SampleEvent()
    const next = mock(async () => {})

    await LoggingMiddleware(event, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('propagates errors from next()', async () => {
    const event = new SampleEvent()
    const next = mock(async () => { throw new Error('handler failed') })

    await expect(LoggingMiddleware(event, next)).rejects.toThrow('handler failed')
  })
})
