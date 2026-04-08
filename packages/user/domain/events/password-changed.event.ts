import { DomainEvent } from '@OneJs/event-bus'
import type { UserDto } from '../../application/dtos/user.dto'
import type { User } from '../entities/user'

export class PasswordChangedEvent extends DomainEvent {
  readonly payload: UserDto

  constructor(user: User) {
    super()
    this.payload = user.toDto()
  }
}
