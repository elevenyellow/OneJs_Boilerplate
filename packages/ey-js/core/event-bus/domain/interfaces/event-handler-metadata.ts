import type { EventHandlerOptions } from './event-handler-options'

export interface EventHandlerMetadata {
  eventType: string
  methodName: string
  options: EventHandlerOptions
}
