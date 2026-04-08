import { Injectable } from '@OneJs/core'
import type { DomainEvent } from '../../domain/events/domain-events'
import type { EventPublisher } from './event-publisher'

@Injectable()
export class InMemoryEventPublisher implements EventPublisher {
  private handlers: Map<string, ((event: DomainEvent) => void)[]> = new Map()

  async publish(eventType: string, event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(eventType) || []

    for (const handler of handlers) {
      handler(event)
    }
  }

  subscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }

    this.handlers.get(eventType)!.push(handler)
  }
}
