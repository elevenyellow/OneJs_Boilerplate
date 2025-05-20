import { EventHandlerOptions } from '../../event-bus/domain/interfaces'
import { ClassConstructor } from '../types'

interface EventHandlerMeta {
  target: ClassConstructor
  methodName: string
  eventType: string
  options: EventHandlerOptions
}

const handlers: EventHandlerMeta[] = []

export function registerEventHandler(meta: EventHandlerMeta) {
  handlers.push(meta)
}

export function getAllEventHandlers(): EventHandlerMeta[] {
  return handlers
}

export function clearEventHandlers() {
  handlers.length = 0
}
