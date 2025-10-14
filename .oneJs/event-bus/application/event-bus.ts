import {
  BootstrapBase,
  ConfigService,
  Inject,
  Injectable,
  Logger,
  container,
} from '@OneJs'
import type { DomainEvent } from '../domain/events/domain-events'
import type { IEventHandler } from '../domain/handlers/event-handler'
import type { EventHandlerOptions } from '../domain/interfaces'
import { getAllEventHandlers } from '../domain/store'
import type { EventBusMiddlewareInterface as Middleware } from './middleware'
import { InMemoryEventPublisher } from './publishers/in-memory-event-publisher'

interface PrioritizedEventHandler<T extends DomainEvent> {
  handler: IEventHandler<T>
  priority: number
}

@Injectable()
export class EventBus extends BootstrapBase {
  private readonly isDevelopment: boolean

  constructor(
    @Inject(InMemoryEventPublisher)
    private readonly eventPublisher: InMemoryEventPublisher,

    @Inject(ConfigService)
    private readonly configService: ConfigService,

    @Inject(Logger)
    private readonly logger: Logger,
  ) {
    super()

    this.isDevelopment = this.configService.get('NODE_ENV') !== 'production'
  }

  private handlers: Map<string, PrioritizedEventHandler<DomainEvent>[]> =
    new Map()
  private middlewares: Middleware[] = []

  public register<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>,
    priority: number = 0,
  ): void {
    this.logger.debug(
      'oneJs:event-bus',
      `Registering event ${eventType} with priority ${priority}`,
    )

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
      this.eventPublisher.subscribe(eventType, this.handleEvent.bind(this))
    }

    const eventHandlers = this.handlers.get(eventType)!
    eventHandlers.push({
      handler: handler as IEventHandler<DomainEvent>,
      priority,
    })

    eventHandlers.sort((a, b) => a.priority - b.priority)
  }

  public use(middleware: Middleware): void {
    this.logger.debug('oneJs:event-bus', `Adding middleware to the event bus`)
    this.middlewares.push(middleware)
  }

  public async publish(event: DomainEvent): Promise<void> {
    const eventType = event.constructor.name

    this.logger.debug('oneJs:event-bus', `Publishing event ${eventType}`)

    await this.eventPublisher.publish(eventType, event)
  }

  private async handleEvent(event: DomainEvent): Promise<void> {
    const eventType = event.constructor.name
    const eventHandlers = this.handlers.get(eventType) || []

    const executeHandlers = async (event: DomainEvent) => {
      for (const { handler } of eventHandlers) {
        try {
          await handler.handle(event)
        } catch (error) {
          this.logger.error(`Error handling the event ${eventType}:`, error)
          if (!this.isDevelopment) throw error
        }
      }
    }

    if (this.middlewares.length === 0) {
      await executeHandlers(event)
      return
    }

    const composedMiddleware = this.middlewares.reduceRight(
      (next, middleware) => async (event: DomainEvent, promise) => {
        try {
          await middleware(event, () => next(event, promise))
        } catch (error) {
          this.logger.error(
            `Error handling middleware for event ${event.constructor.name}`,
            error,
          )
          if (!this.isDevelopment) throw error
        }
      },
      executeHandlers,
    )

    try {
      await composedMiddleware(event, () =>
        Promise.resolve().catch((error) => {
          this.logger.warn(
            `Error in middleware while handling ${event.constructor.name}:`,
            error,
          )
          if (!this.isDevelopment) throw error
        }),
      )
    } catch (error) {
      this.logger.error(`Error while handling event ${eventType}`, error)
      if (!this.isDevelopment) throw error
    }
  }

  public subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>,
    options: EventHandlerOptions = {},
  ): void {
    const priority = options.priority || 0
    this.register(eventType, handler, priority)
  }

  bootstrap(): Promise<void> | void {
    this.logger.debug('oneJs:event-bus', '🧩 Registering event handlers...')

    const eventBus = container.get(EventBus)

    for (const {
      target,
      methodName,
      eventType,
      options,
    } of getAllEventHandlers()) {
      this.logger.debug('oneJs:event-bus', `Subscribing to event ${eventType}`)

      const handler = {
        handle: async (event: DomainEvent) => {
          const instance = container.get(target)
          return instance[methodName](event)
        },
      }

      eventBus.subscribe(eventType, handler, options)
    }
  }
}
