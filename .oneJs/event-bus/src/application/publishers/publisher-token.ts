/**
 * DI token used to inject the active EventPublisher implementation.
 *
 * Default binding: InMemoryEventPublisher (registered by EventBusPlugin).
 * Override binding: custom bridge instance (for example RedisBridge)
 * passed into EventBusPlugin's constructor.
 */
export const PUBLISHER_TOKEN: unique symbol = Symbol('EventPublisher')
