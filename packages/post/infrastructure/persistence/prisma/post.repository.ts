import { Injectable, Inject } from '@EyJs'
import { PostEntity } from '@post/domain/entities/post'
import { UserEntity } from '@user/domain/entities/user.entity'
import { PrismaClientEy, PrismaRepository } from '@EyJs/Prisma'

@Injectable()
export class PostPrismaRepository extends PrismaRepository<'post'> {
  constructor(@Inject(PrismaClientEy) protected readonly prisma: PrismaClientEy) {
    super(prisma, 'post')
  }

  async findByUserId(userId: string): Promise<PostEntity[]> {
    const posts = await this.prisma.post.findMany({
      where: { userId },
      include: { user: true },
    })
    return posts.map(this.toEntity)
  }

  async findByTitle(title: string): Promise<PostEntity[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        title: {
          contains: title,
          mode: 'insensitive',
        },
      },
      include: { user: true },
    })

    return posts.map(this.toEntity)
  }

  async findById(id: string): Promise<PostEntity | null> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { user: true },
    })
    return post ? this.toEntity(post) : null
  }

  async createEntity(post: PostEntity): Promise<PostEntity> {
    await this.prisma.post.create({
      data: this.toPrisma(post),
    })
    return (await this.findById(post.id.toString()))!
  }

  async updateEntity(post: PostEntity): Promise<void> {
    await this.prisma.post.update({
      where: { id: post.id },
      data: this.toPrisma(post),
    })
  }

  async deleteEntity(id: string): Promise<void> {
    await this.prisma.post.delete({ where: { id } })
  }

  private toEntity = (doc: any): PostEntity => {
    const user = doc.user
      ? new UserEntity(
          doc.user.id,
          doc.user.name,
          doc.user.email,
          doc.user.password,
          doc.user.posts?.map((p: any) => p.id) || [],
          doc.user.createdAt,
          doc.user.updatedAt,
          [],
        )
      : undefined

    return new PostEntity(
      doc.id,
      doc.title,
      doc.content,
      doc.userId,
      doc.createdAt,
      doc.updatedAt,
      user,
    )
  }

  private toPrisma(post: PostEntity) {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      userId: post.userId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }
  }
}
