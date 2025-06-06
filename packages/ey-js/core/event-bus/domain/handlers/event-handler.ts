import type { DomainEvent } from '../events/domain-events'

export interface IEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void> // Método que maneja el evento
}
