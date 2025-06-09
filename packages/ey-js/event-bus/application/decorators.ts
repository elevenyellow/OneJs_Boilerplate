import type { ClassConstructor } from '@ey-js/core'
import type { DomainEvent } from '../domain/events/domain-events'
import type { EventHandlerOptions } from '../domain/interfaces'
import { registerEventHandler } from '../domain/store'

/**
 * Registra un método como manejador de eventos para una clase que extiende DomainEvent.
 *
 * @param eventType - Clase del evento (constructor)
 * @param options - Opciones como prioridad o ejecución única
 */
export function EventHandler<T extends DomainEvent>(
  eventType: ClassConstructor<T>,
  options: EventHandlerOptions = {},
): MethodDecorator {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const controller = target.constructor as ClassConstructor

    // Validación opcional en tiempo de ejecución
    if (
      typeof eventType !== 'function' ||
      !(eventType.prototype instanceof Object) ||
      !Object.getPrototypeOf(eventType.prototype)?.constructor?.name.includes(
        'DomainEvent',
      )
    ) {
      console.warn(
        `⚠️ [EventHandler] ${controller.name}.${String(propertyKey)} está intentando registrar un tipo inválido:`,
        eventType,
      )
    }

    registerEventHandler({
      target: controller,
      methodName: propertyKey as string,
      eventType: eventType.name,
      options,
    })

    return descriptor
  }
}
