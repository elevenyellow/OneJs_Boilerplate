import { container } from '../../container'
import type { DomainEvent } from '../domain/events/domain-events'
import { EventBus } from './event-bus'
import type { IEventHandler } from '../domain/handlers/event-handler'

interface EventHandlerOptions {
  context?: any
  once?: boolean
  priority?: number
}

export function EventHandler(
  eventType: string | Function,
  options: EventHandlerOptions = {},
) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    // Asegurarse de que el EventBus esté registrado en el contenedor
    if (!container.get(EventBus)) {
      throw new Error('EventBus is not registered in the dependency container')
    }

    // Obtener o crear el EventBus
    const eventBus = container.get<EventBus>(EventBus)

    // Crear un manejador de eventos que cumpla con la interfaz IEventHandler
    const handler: IEventHandler<DomainEvent> = {
      handle: async (event: DomainEvent) => {
        // Obtener la instancia del objeto desde el contenedor de dependencias
        const instance = container.get(target.constructor)

        // Ejecutar el método decorado usando la instancia obtenida
        return originalMethod.call(instance, event)
      },
    }

    const eventName = typeof eventType === 'string' ? eventType : eventType.name

    // Usar el método subscribe del EventBus para registrar el manejador
    eventBus.subscribe(eventName, handler, options)

    return descriptor
  }
}
