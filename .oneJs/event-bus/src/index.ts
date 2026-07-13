export { EventHandler } from './application/decorators'
export { EventBus } from './application/event-bus'
export * from './application/logging-middleware'
export * from './application/middleware'
// Extension points: implement EventBusBridge to add a custom transport
export type { EventPublisher } from './application/publishers/event-publisher'
export { PUBLISHER_TOKEN } from './application/publishers/publisher-token'
export type {
  EventRegistry,
  RedisBridgeOptions,
} from './application/publishers/redis-bridge'
// Built-in Redis bridge
export { RedisBridge } from './application/publishers/redis-bridge'
export { DomainEvent } from './domain/events/domain-events'
export * from './domain/handlers/event-handler'
export type { EventBusBridge } from './domain/interfaces/event-bus-bridge'
export { EventBusPlugin } from './event-bus-plugin'
