import type { Container } from '@OneJs/core'
import type { EventPublisher } from '../../application/publishers/event-publisher'

/**
 * Contract for all EventBus transport bridges.
 *
 * Implement this interface to create a custom bridge (Redis, NATS, AMQP, etc.)
 * and pass an instance to EventBusPlugin's constructor:
 *
 *   new EventBusPlugin(new RedisBridge({ mode: 'publisher', integrationEvents: [...] }))
 *
 * The bridge lifecycle:
 *   1. register() — plugin registers the bridge instance with the DI container
 *   2. subscribe() — called by EventBus for every @EventHandler found in the process
 *   3. init()      — called once after all subscriptions are wired; use to open
 *                    connections, activate subscribers, etc.
 */
export interface EventBusBridge extends EventPublisher {
  init?(container: Container): Promise<void>
}
