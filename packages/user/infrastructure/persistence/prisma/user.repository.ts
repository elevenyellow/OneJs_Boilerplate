import {
  OneJsError,
  Inject,
  Injectable,
} from '@OneJs/core'
import { PostEntity } from '@post/domain/entities/post'
import { UserEntity } from '@user/domain/entities/user.entity'
import { Id } from '@user/domain/value-objects/id'
import { PrismaClientOneJs, PrismaRepository } from '@OneJs/prisma'

@Injectable()
export class UserPrismaRepository extends PrismaRepository<'user'> {
  constructor(
    @Inject(PrismaClientOneJs) protected readonly prisma: PrismaClientOneJs,
  ) {
    super(prisma, 'user')
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { posts: true }, // similar a populate
    })

    return user ? this.toEntity(user) : null
  }

  async createEntity(user: UserEntity): Promise<UserEntity> {
    await this.prisma.user.create({
      data: this.toPrismaCreate(user),
    })

    return (await this.findById(user.id.toString()))!
  }

  async updateEntity(user: UserEntity): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id.toString() },
      data: this.toPrismaUpdate(user),
    })
  }

  async addPost(userId: string, postId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new OneJsError('USER_NOT_FOUND', 404, 'User not found')

    await this.prisma.post.update({
      where: { id: postId },
      data: { userId },
    })
  }

  async deleteEntity(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } })
  }

  private toEntity(user: {
    id: string
    name: string
    email: string
    password: string
    postIds?: string[] // opcional si no mapeas desde prisma
    posts?: any[]
    createdAt: Date
    updatedAt: Date
  }): UserEntity {
    const posts =
      user.posts?.map(
        (post) =>
          new PostEntity(
            Id.createFrom(post.id),
            post.title,
            post.content,
            post.userId,
            post.createdAt,
            post.updatedAt,
          ),
      ) || []

    return new UserEntity(
      Id.createFrom(user.id),
      user.name,
      user.email,
      user.password,
      posts.map((p) => p.id.toString()), // puedes derivar los postIds desde posts
      user.createdAt,
      user.updatedAt,
      posts,
    )
  }

  private toPrismaCreate(user: UserEntity) {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      posts: {
        connect: user.postIds.map((id) => ({ id })),
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  private toPrismaUpdate(user: UserEntity) {
    return {
      name: user.name,
      email: user.email,
      password: user.password,
      updatedAt: user.updatedAt,
      posts: {
        set: user.postIds.map((id) => ({ id })), // redefine relación
      },
    }
  }
}
