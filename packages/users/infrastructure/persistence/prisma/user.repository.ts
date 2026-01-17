import { Inject, Injectable } from '@OneJs/core'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'
import type { Prisma } from '@prisma/client'
import { User } from '../../../domain/entities/user.entity'
import { Id, ClerkId, Email } from '../../../domain/value-objects'

@Injectable()
export class UserPrismaRepository extends PrismaRepository<'user'> {
  constructor(@Inject(PrismaClientOneJs) prisma: PrismaClientOneJs) {
    super(prisma, 'user')
  }

  async findByClerkId(clerkId: ClerkId): Promise<User | null> {
    const data = await this.findOne({
      where: { clerkId: clerkId.getValue() },
    })

    if (!data) return null

    return this.mapToDomain(data)
  }

  async findById(id: Id): Promise<User | null> {
    const data = await this.findOne({
      where: { id: id.getValue() },
    })

    if (!data) return null

    return this.mapToDomain(data)
  }

  async findByEmail(email: Email): Promise<User | null> {
    const data = await this.findOne({
      where: { email: email.getValue() },
    })

    if (!data) return null

    return this.mapToDomain(data)
  }

  async save(user: User): Promise<User> {
    const dto = user.toDatabaseDto()

    const data = await this.model.upsert({
      where: { clerkId: dto.clerkId },
      create: this.mapToPrisma(dto),
      update: this.mapToPrisma(dto),
    })

    return this.mapToDomain(data)
  }

  async existsByClerkId(clerkId: ClerkId): Promise<boolean> {
    const count = await this.model.count({
      where: { clerkId: clerkId.getValue() },
    })
    return count > 0
  }

  private mapToDomain(data: Prisma.UserGetPayload<object>): User {
    return User.fromDatabase({
      id: data.id,
      clerkId: data.clerkId,
      email: data.email,
      name: data.name,
      avatar: data.avatar,
      preferences: data.preferences as Record<string, unknown> | null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }

  private mapToPrisma(dto: {
    id: string
    clerkId: string
    email: string
    name: string | null
    avatar: string | null
    preferences: Record<string, unknown> | null
  }): Prisma.UserCreateInput {
    return {
      id: dto.id,
      clerkId: dto.clerkId,
      email: dto.email,
      name: dto.name,
      avatar: dto.avatar,
      preferences: dto.preferences as unknown as Prisma.InputJsonValue,
    }
  }
}
