import { Inject, Injectable, Logger } from '@OneJs/core'
import { EventHandler } from '@OneJs/event-bus'
import { UserRegisteredEvent } from '../../domain/events/user-registered.event'

@Injectable()
export class UserRegisteredHandler {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  @EventHandler(UserRegisteredEvent)
  async handle(event: UserRegisteredEvent): Promise<void> {
    const { id, email } = event.payload
    this.logger.info(
      'user:events',
      `New user registered — id: ${id}, email: "${email}"`,
    )
  }
}
