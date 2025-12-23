import type { DomainEvent } from '../../domain/events/domain-events'
import { EventBus } from '../../application/event-bus'

export class DistributedEventBus extends EventBus {
  // Sobreescribir la función publish para simular un bus distribuido
  public async publish(event: DomainEvent): Promise<void> {
    // Aquí podrías enviar el evento a una cola de mensajes como Kafka o RabbitMQ
    await super.publish(event) // Sigue ejecutando handlers locales
  }
}
