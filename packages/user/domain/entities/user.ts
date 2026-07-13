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
    private readonly _email: Email,
    private readonly _passwordHash: PasswordHash,
    private readonly _role: UserRole,
    private readonly _createdAt: Date,
    private readonly _resetToken: ResetToken | null,
  ) {
    super(id)
  }

  getEmail(): Email {
    return this._email
  }

  getPasswordHash(): PasswordHash {
    return this._passwordHash
  }

  getRole(): UserRole {
    return this._role
  }

  getCreatedAt(): Date {
    return this._createdAt
  }

  getResetToken(): ResetToken | null {
    return this._resetToken
  }

  static register(email: Email, passwordHash: PasswordHash): User {
    return new User(
      UserId.generateUniqueId(),
      email,
      passwordHash,
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

  withPasswordHash(hash: PasswordHash): User {
    return new User(
      this.getId(),
      this._email,
      hash,
      this._role,
      this._createdAt,
      null,
    )
  }

  withResetToken(token: ResetToken | null): User {
    return new User(
      this.getId(),
      this._email,
      this._passwordHash,
      this._role,
      this._createdAt,
      token,
    )
  }

  toDto(): UserDto {
    return new UserDto(
      this.getId().getValue(),
      this._email.getValue(),
      this._role.getValue(),
      this._createdAt,
    )
  }
}
