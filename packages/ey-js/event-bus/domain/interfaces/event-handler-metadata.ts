import type { EventHandlerOptions } from './event-handler-options'

export interface handlerHandlerMetadata {
  eventType: string
  methodName: string
  options: EventHandlerOptions
}
