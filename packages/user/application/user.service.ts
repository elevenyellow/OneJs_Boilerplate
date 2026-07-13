import {
  ConfigService,
  ErrorCodes,
  Inject,
  Injectable,
  Logger,
  OneJsError,
} from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { User } from '../domain/entities/user'
import { PasswordChangedEvent } from '../domain/events/password-changed.event'
import { PasswordResetRequestedEvent } from '../domain/events/password-reset-requested.event'
import { UserRegisteredEvent } from '../domain/events/user-registered.event'
import type { IUserRepository } from '../domain/repositories/user.repository.interface'
import type { Email } from '../domain/value-objects/email'
import { PasswordHash } from '../domain/value-objects/password-hash'
import { ResetToken } from '../domain/value-objects/reset-token'
import type { UserId } from '../domain/value-objects/user-id'
import { InMemoryUserRepository } from '../infrastructure/repositories/in-memory-user.repository'

const MIN_PASSWORD_LENGTH = 8

@Injectable()
export class UserService {
  constructor(
    @Inject(InMemoryUserRepository)
    private readonly repository: IUserRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async register(email: Email, password: string): Promise<User> {
    this.validatePassword(password)

    const existing = await this.repository.findByEmail(email)
    if (existing)
      throw new OneJsError(
        'Conflict',
        409,
        'Email already in use',
        {},
        ErrorCodes.USER_ALREADY_EXISTS,
      )

    const hash = await Bun.password.hash(password)
    const user = User.register(email, PasswordHash.create(hash))

    await this.repository.save(user)
    await this.eventBus.publish(new UserRegisteredEvent(user))

    this.logger.debug(
      'user:service',
      `User registered: ${user.getId().getValue()}`,
    )
    return user
  }

  async login(
    email: Email,
    password: string,
  ): Promise<{ token: string; user: User }> {
    const user = await this.repository.findByEmail(email)
    if (!user)
      throw new OneJsError(
        'Unauthorized',
        401,
        'Invalid credentials',
        {},
        ErrorCodes.AUTH_INVALID,
      )

    const valid = await Bun.password.verify(
      password,
      user.getPasswordHash().getValue(),
    )
    if (!valid)
      throw new OneJsError(
        'Unauthorized',
        401,
        'Invalid credentials',
        {},
        ErrorCodes.AUTH_INVALID,
      )

    const token = this.signToken(user)
    this.logger.debug(
      'user:service',
      `User logged in: ${user.getId().getValue()}`,
    )
    return { token, user }
  }

  async forgotPassword(email: Email): Promise<string | null> {
    const user = await this.repository.findByEmail(email)
    if (!user) {
      this.logger.debug(
        'user:service',
        `Forgot-password: no user for ${email.getValue()}`,
      )
      return null
    }

    const resetToken = uuidv4()
    const updated = user.withResetToken(ResetToken.create(resetToken))
    await this.repository.save(updated)
    await this.eventBus.publish(
      new PasswordResetRequestedEvent(updated, resetToken),
    )

    this.logger.debug(
      'user:service',
      `Reset token issued for ${email.getValue()}`,
    )
    return resetToken
  }

  async resetPassword(token: ResetToken, newPassword: string): Promise<void> {
    this.validatePassword(newPassword)

    const user = await this.repository.findByResetToken(token)
    if (!user)
      throw new OneJsError(
        'Bad Request',
        400,
        'Invalid or expired reset token',
        {},
        ErrorCodes.AUTH_INVALID,
      )

    const hash = await Bun.password.hash(newPassword)
    const updated = user.withPasswordHash(PasswordHash.create(hash))
    await this.repository.save(updated)
    await this.eventBus.publish(new PasswordChangedEvent(updated))

    this.logger.debug(
      'user:service',
      `Password reset for user ${user.getId().getValue()}`,
    )
  }

  async updatePassword(
    userId: UserId,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    this.validatePassword(newPassword)

    const user = await this.repository.findById(userId)
    if (!user)
      throw new OneJsError(
        'Not Found',
        404,
        `User not found: ${userId.getValue()}`,
        {},
        ErrorCodes.USER_NOT_FOUND,
      )

    const valid = await Bun.password.verify(
      currentPassword,
      user.getPasswordHash().getValue(),
    )
    if (!valid)
      throw new OneJsError(
        'Unauthorized',
        401,
        'Current password is incorrect',
        {},
        ErrorCodes.AUTH_INVALID,
      )

    const hash = await Bun.password.hash(newPassword)
    const updated = user.withPasswordHash(PasswordHash.create(hash))
    await this.repository.save(updated)
    await this.eventBus.publish(new PasswordChangedEvent(updated))

    this.logger.debug(
      'user:service',
      `Password updated for user ${userId.getValue()}`,
    )
  }

  async getById(userId: UserId): Promise<User | null> {
    return this.repository.findById(userId)
  }

  private signToken(user: User): string {
    const secret = this.configService.get('JWT_SECRET') ?? 'default_secret'
    return jwt.sign(
      {
        sub: user.getId().getValue(),
        email: user.getEmail().getValue(),
        role: user.getRole().getValue(),
      },
      secret,
      { expiresIn: '7d' },
    )
  }

  private validatePassword(password: string): void {
    if (!password || password.length < MIN_PASSWORD_LENGTH)
      throw new OneJsError(
        'Validation failed',
        400,
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        {},
        ErrorCodes.VALIDATION_FAILED,
      )
  }
}
