import type { ClassConstructor } from '@OneJs/core'
import { logger, markAs } from '@OneJs/core'
import type { DomainEvent } from '../domain/events/domain-events'
import type { EventHandlerOptions } from '../domain/interfaces'
import { registerEventHandler } from '../domain/store'

export function EventHandler<T extends DomainEvent>(
  eventType: ClassConstructor<T>,
  options: EventHandlerOptions = {},
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const controller = target.constructor as ClassConstructor

    if (
      typeof eventType !== 'function' ||
      !(eventType.prototype instanceof Object) ||
      !Object.getPrototypeOf(eventType.prototype)?.constructor?.name.includes(
        'DomainEvent',
      )
    ) {
      logger.warn(
        'oneJs:event-bus',
        `[EventHandler] ${controller.name}.${String(propertyKey)} registering invalid type: ${eventType?.name}`,
      )
    }

    markAs(controller, 'handler')

    registerEventHandler({
      target: controller,
      methodName: String(propertyKey),
      eventType: eventType.name,
      eventConstructor: eventType as unknown as ClassConstructor,
      options,
    })

    return descriptor
  }
}
