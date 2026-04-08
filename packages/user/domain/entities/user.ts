import { Entity, EntityBase } from '@OneJs/core'
import { UserDto } from '../../application/dtos/user.dto'
import { Email } from '../value-objects/email'
import { PasswordHash } from '../value-objects/password-hash'
import { ResetToken } from '../value-objects/reset-token'
import { UserId } from '../value-objects/user-id'
import { UserRole } from '../value-objects/user-role'

@Entity()
export class User extends EntityBase<UserId> {
  constructor(
    id: UserId,
    readonly email: Email,
    readonly passwordHash: PasswordHash,
    readonly role: UserRole,
    readonly createdAt: Date,
    readonly resetToken: ResetToken | null,
  ) {
    super(id)
  }

  static register(email: string, passwordHash: string): User {
    return new User(
      UserId.generateUniqueId(),
      Email.create(email),
      PasswordHash.create(passwordHash),
      UserRole.user(),
      new Date(),
      null,
    )
  }

  static reconstitute(
    id: string,
    email: string,
    passwordHash: string,
    role: string,
    createdAt: Date,
    resetToken: string | null,
  ): User {
    return new User(
      UserId.fromString(id),
      Email.create(email),
      PasswordHash.create(passwordHash),
      UserRole.create(role),
      createdAt,
      resetToken ? ResetToken.create(resetToken) : null,
    )
  }

  withPasswordHash(hash: string): User {
    return new User(
      this.getId(),
      this.email,
      PasswordHash.create(hash),
      this.role,
      this.createdAt,
      null,
    )
  }

  withResetToken(token: string | null): User {
    return new User(
      this.getId(),
      this.email,
      this.passwordHash,
      this.role,
      this.createdAt,
      token ? ResetToken.create(token) : null,
    )
  }

  toDto(): UserDto {
    return new UserDto(
      this.getId().getValue(),
      this.email.getValue(),
      this.role.getValue(),
      this.createdAt,
    )
  }
}
