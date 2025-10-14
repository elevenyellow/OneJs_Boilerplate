import { EventHandler, Inject, Injectable, Logger } from '@OneJs'
import { UserCreatedEvent } from '../events/user-created.event'

@Injectable()
export class UserCreatedObserver {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  @EventHandler(UserCreatedEvent)
  async handle(event: UserCreatedEvent): Promise<void> {
    this.logger.info(`Called event: UserCreatedEvent`)
    this.logger.info(`User created: ${event.user.email}`)
    // Aquí podrías agregar más lógica como:
    // - Enviar email de bienvenida
    // - Crear perfil inicial
    // - Notificar a otros sistemas
  }
}
