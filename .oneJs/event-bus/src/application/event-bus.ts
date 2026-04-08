import { ConfigService, Inject, Injectable, Logger } from '@OneJs/core'
import type { DomainEvent } from '../domain/events/domain-events'
import type { IEventHandler } from '../domain/handlers/event-handler'
import type { EventHandlerOptions } from '../domain/interfaces'
import type { EventBusMiddlewareInterface as Middleware } from './middleware'
import type { EventPublisher } from './publishers/event-publisher'
import { PUBLISHER_TOKEN } from './publishers/publisher-token'

interface PrioritizedEventHandler<T extends DomainEvent> {
  handler: IEventHandler<T>
  priority: number
}

type HandlerFn = (
  event: DomainEvent,
  next: () => Promise<void>,
) => Promise<void>

@Injectable()
export class EventBus {
  private readonly isDevelopment: boolean
  private handlers: Map<string, PrioritizedEventHandler<DomainEvent>[]> =
    new Map()
  private middlewares: Middleware[] = []

  constructor(
    @Inject(PUBLISHER_TOKEN) private readonly eventPublisher: EventPublisher,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(Logger) private readonly logger: Logger,
  ) {
    this.isDevelopment = this.configService.get('NODE_ENV') !== 'production'
  }

  public register<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>,
    priority = 0,
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
    this.logger.debug('oneJs:event-bus', 'Adding middleware to the event bus')
    this.middlewares.push(middleware)
  }

  public async publish(event: DomainEvent): Promise<void> {
    this.logger.debug(
      'oneJs:event-bus',
      `Publishing event ${event.constructor.name}`,
    )
    await this.eventPublisher.publish(event.constructor.name, event)
  }

  public subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>,
    options: EventHandlerOptions = {},
  ): void {
    this.register(eventType, handler, options.priority || 0)
  }

  private async executeHandlers(
    event: DomainEvent,
    handlers: PrioritizedEventHandler<DomainEvent>[],
  ): Promise<void> {
    for (const { handler } of handlers) {
      try {
        await handler.handle(event)
      } catch (error) {
        this.logger.error(
          'oneJs:event-bus',
          `Error handling event ${event.constructor.name}`,
          {
            error: String(error),
          },
        )
        if (!this.isDevelopment) throw error
      }
    }
  }

  private composeMiddlewareChain(baseHandler: HandlerFn): HandlerFn {
    return this.middlewares.reduceRight(
      (next, middleware) => async (event: DomainEvent, promise) => {
        try {
          await middleware(event, () => next(event, promise))
        } catch (error) {
          this.logger.error(
            'oneJs:event-bus',
            `Middleware error for event ${event.constructor.name}`,
            { error: String(error) },
          )
          if (!this.isDevelopment) throw error
        }
      },
      baseHandler,
    )
  }

  private async handleEvent(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.constructor.name) || []
    const baseHandler: HandlerFn = (e) => this.executeHandlers(e, handlers)

    if (this.middlewares.length === 0) {
      await baseHandler(event, () => Promise.resolve())
      return
    }

    try {
      await this.composeMiddlewareChain(baseHandler)(event, () =>
        Promise.resolve(),
      )
    } catch (error) {
      this.logger.error(
        'oneJs:event-bus',
        `Error while handling event ${event.constructor.name}`,
        {
          error: String(error),
        },
      )
      if (!this.isDevelopment) throw error
    }
  }
}
