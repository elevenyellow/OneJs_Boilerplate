import type { DomainEvent } from '../../domain/events/domain-events'

export interface EventPublisher {
  publish(eventType: string, event: DomainEvent): Promise<void>
  subscribe(eventType: string, handler: (event: DomainEvent) => void): void
}
