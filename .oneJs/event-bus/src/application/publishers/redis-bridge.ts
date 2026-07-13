import type { Container } from '@OneJs/core'
import { ConfigService, logger } from '@OneJs/core'
import IORedis from 'ioredis'
import type { DomainEvent } from '../../domain/events/domain-events'
import type { EventBusBridge } from '../../domain/interfaces/event-bus-bridge'
import { getAllEventHandlers } from '../../domain/store'
import { InMemoryEventPublisher } from './in-memory-event-publisher'

const DEFAULT_CHANNEL = 'oneJs:integration:events'

type EventConstructor = { prototype: DomainEvent }

export type EventRegistry = Record<string, EventConstructor>

export const REDIS_BRIDGE_MODE = {
  PUBLISHER: 'publisher',
  SUBSCRIBER: 'subscriber',
  BOTH: 'both',
} as const

type BridgeMode = (typeof REDIS_BRIDGE_MODE)[keyof typeof REDIS_BRIDGE_MODE]

export interface RedisBridgeOptions {
  mode?: BridgeMode
  channel?: string
}

function serialize(event: DomainEvent): string {
  return JSON.stringify({
    ...event,
    type: event.constructor.name,
    occurredOn: event.occurredOn.toISOString(),
  })
}

function deserialize(registry: EventRegistry, raw: string): DomainEvent | null {
  let data: Record<string, unknown>

  try {
    data = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }

  const type = data.type as string | undefined
  if (!type) return null

  const EventClass = registry[type]
  if (!EventClass) return null

  const event = Object.create(EventClass.prototype) as DomainEvent
  const { type: _t, occurredOn, ...rest } = data
  Object.assign(event, { ...rest, occurredOn: new Date(occurredOn as string) })

  return event
}

/**
 * Redis Pub/Sub bridge for cross-process event delivery.
 *
 * Implements the EventBusBridge contract — same interface as the built-in
 * in-memory transport — and is wired by passing an instance to EventBusPlugin:
 *
 *   // API process (publisher)
 *   new EventBusPlugin(new RedisBridge({
 *     mode: 'publisher',
 *   }))
 *
 *   // Notifications process (subscriber)
 *   new EventBusPlugin(new RedisBridge({
 *     mode: 'subscriber',
 *   }))
 *
 *   // Single process that both publishes and subscribes
 *   new EventBusPlugin(new RedisBridge({ mode: 'both' }))
 */
export class RedisBridge implements EventBusBridge {
  private readonly local = new InMemoryEventPublisher()
  private pubClient?: IORedis
  private subClient?: IORedis
  private readonly inboundHandlers = new Map<
    string,
    (event: DomainEvent) => void
  >()
  private readonly mode: BridgeMode

  constructor(private readonly options: RedisBridgeOptions = {}) {
    this.mode = options.mode ?? REDIS_BRIDGE_MODE.BOTH
  }

  private isPublisherMode(): boolean {
    return (
      this.mode === REDIS_BRIDGE_MODE.PUBLISHER ||
      this.mode === REDIS_BRIDGE_MODE.BOTH
    )
  }

  private isSubscriberMode(): boolean {
    return (
      this.mode === REDIS_BRIDGE_MODE.SUBSCRIBER ||
      this.mode === REDIS_BRIDGE_MODE.BOTH
    )
  }

  async init(container: Container): Promise<void> {
    const config = container.get(ConfigService)
    const url = config.get('REDIS_URL') as string | undefined
    if (!url) throw new Error('REDIS_URL is required for RedisBridge')

    this.pubClient = new IORedis(url)
    this.subClient = new IORedis(url)

    logger.debug(
      'oneJs:event-bus',
      `🔌 RedisBridge connected (mode: ${this.mode})`,
    )

    if (this.isSubscriberMode()) {
      await this.activateSubscriber()
    }
  }

  async publish(eventType: string, event: DomainEvent): Promise<void> {
    await this.local.publish(eventType, event)

    if (!this.isPublisherMode()) return

    const channel = this.options.channel ?? DEFAULT_CHANNEL
    await this.pubClient!.publish(channel, serialize(event))

    logger.debug(
      'oneJs:event-bus',
      `📤 Forwarded ${eventType} to Redis channel "${channel}"`,
    )
  }

  subscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    this.local.subscribe(eventType, handler)

    if (this.isSubscriberMode()) {
      this.inboundHandlers.set(eventType, handler)
    }
  }

  private async activateSubscriber(): Promise<void> {
    if (this.inboundHandlers.size === 0) return

    const channel = this.options.channel ?? DEFAULT_CHANNEL

    // Auto-discover event constructors from decorator metadata for all
    // inbound handlers wired in this process.
    const registry: EventRegistry = {}
    for (const { eventType, eventConstructor } of getAllEventHandlers()) {
      if (this.inboundHandlers.has(eventType)) {
        registry[eventType] = { prototype: eventConstructor.prototype }
      }
    }

    await this.subClient!.subscribe(channel)

    this.subClient!.on('message', async (_ch: string, message: string) => {
      const event = deserialize(registry, message)
      if (!event) {
        logger.debug(
          'oneJs:event-bus',
          '⚠️  Redis message ignored (unknown type or parse error)',
        )
        return
      }

      const handler = this.inboundHandlers.get(event.constructor.name)
      if (!handler) return

      logger.debug(
        'oneJs:event-bus',
        `📥 Received ${event.constructor.name} from Redis channel "${channel}"`,
      )

      await handler(event)
    })

    logger.debug(
      'oneJs:event-bus',
      `✅ RedisBridge subscribed to channel "${channel}" for ${this.inboundHandlers.size} event type(s)`,
    )
  }
}
