import type { DomainEvent } from '@OneJs/event-bus'

/**
 * InMemory EventBus for testing - synchronous, no Redis
 */
export class InMemoryEventBus {
  private readonly events: DomainEvent[] = []
  private readonly handlers = new Map<
    string,
    Array<(event: any) => Promise<void>>
  >()

  async publish(event: DomainEvent): Promise<void> {
    this.events.push(event)
    const eventName = event.constructor.name
    const handlersForEvent = this.handlers.get(eventName) || []
    for (const handler of handlersForEvent) {
      await handler(event)
    }
  }

  subscribe(eventName: string, handler: (event: any) => Promise<void>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, [])
    }
    this.handlers.get(eventName)!.push(handler)
  }

  getPublishedEvents(): DomainEvent[] {
    return [...this.events]
  }

  getEventsByType<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
  ): T[] {
    return this.events.filter((e) => e instanceof eventType) as T[]
  }

  clear(): void {
    this.events.length = 0
    this.handlers.clear()
  }
}
