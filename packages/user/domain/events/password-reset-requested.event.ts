import { DomainEvent } from '@OneJs/event-bus'
import type { UserDto } from '../../application/dtos/user.dto'
import type { User } from '../entities/user'

export class PasswordResetRequestedEvent extends DomainEvent {
  readonly payload: UserDto
  readonly resetToken: string

  constructor(user: User, resetToken: string) {
    super()
    this.payload = user.toDto()
    this.resetToken = resetToken
  }
}
