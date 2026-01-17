import type { UserDatabaseDto, UserResponseDto, CreateUserInputDto } from '../dtos'
import { Id, ClerkId, Email, UserName } from '../value-objects'

export interface UserCreateInput {
  id?: string
  clerkId: string
  email: string
  name?: string | null
  avatar?: string | null
  preferences?: Record<string, unknown> | null
}

export class User {
  private constructor(
    private readonly id: Id,
    private readonly clerkId: ClerkId,
    private readonly email: Email,
    private readonly name: UserName,
    private readonly avatar: string | null,
    private readonly preferences: Record<string, unknown> | null,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(input: UserCreateInput): User {
    const clerkId = ClerkId.createFrom(input.clerkId)
    const email = Email.createFrom(input.email)
    const name = UserName.createFrom(input.name)

    const now = new Date()

    return new User(
      input.id ? Id.createFrom(input.id) : Id.generateUniqueId(),
      clerkId,
      email,
      name,
      input.avatar ?? null,
      input.preferences ?? null,
      now,
      now,
    )
  }

  static fromDatabase(dto: UserDatabaseDto): User {
    return new User(
      Id.createFrom(dto.id),
      ClerkId.createFrom(dto.clerkId),
      Email.createFrom(dto.email),
      UserName.createFrom(dto.name),
      dto.avatar,
      dto.preferences,
      dto.createdAt,
      dto.updatedAt,
    )
  }

  getId(): Id {
    return this.id
  }

  getClerkId(): ClerkId {
    return this.clerkId
  }

  getEmail(): Email {
    return this.email
  }

  getName(): UserName {
    return this.name
  }

  getAvatar(): string | null {
    return this.avatar
  }

  getPreferences(): Record<string, unknown> | null {
    return this.preferences
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  toDatabaseDto(): UserDatabaseDto {
    return {
      id: this.id.getValue(),
      clerkId: this.clerkId.getValue(),
      email: this.email.getValue(),
      name: this.name.getValue(),
      avatar: this.avatar,
      preferences: this.preferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  toResponseDto(): UserResponseDto {
    return {
      id: this.id.getValue(),
      clerkId: this.clerkId.getValue(),
      email: this.email.getValue(),
      name: this.name.getValue(),
      avatar: this.avatar,
      preferences: this.preferences,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }

  update(input: {
    name?: string | null
    avatar?: string | null
    preferences?: Record<string, unknown> | null
  }): User {
    return new User(
      this.id,
      this.clerkId,
      this.email,
      UserName.createFrom(input.name ?? this.name.getValue()),
      input.avatar ?? this.avatar,
      input.preferences ?? this.preferences,
      this.createdAt,
      new Date(),
    )
  }
}
