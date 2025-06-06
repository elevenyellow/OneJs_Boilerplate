import type { EventHandlerOptions } from '../../event-bus/domain/interfaces'
import { registerEventHandler } from '../metadata/event-handler.registry'

export function EventHandler(
  eventType: string | Function,
  options: EventHandlerOptions = {},
) {
  return (
    target: any,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) => {
    const eventName = typeof eventType === 'string' ? eventType : eventType.name

    registerEventHandler({
      target: target.constructor,
      methodName: propertyKey,
      eventType: eventName,
      options,
    })
  }
}
