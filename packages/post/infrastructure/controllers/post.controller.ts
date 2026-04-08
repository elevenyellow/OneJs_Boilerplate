import { Inject } from '@OneJs/core'
import { Controller, Get, Post } from '@OneJs/server'
import { CreatePostUseCase } from '@post/application/use-cases/create-post.use-case'
import { CreatePostDto } from '@post/domain/dtos/create-post.dto'
import type { PostEntity } from '@post/domain/entities/post'
import { PostPrismaRepository } from '@post/infrastructure/persistence/prisma/post.repository'

@Controller('/posts')
export class PostController {
  constructor(
    @Inject(PostPrismaRepository) private readonly posts: PostPrismaRepository,
    @Inject(CreatePostUseCase)
    private readonly createPostUseCase: CreatePostUseCase,
  ) {}

  @Post('/')
  async createPost(request: Request, response: Response) {
    const { title, content, userId } = request.body
    const postDto = CreatePostDto.create(title, content, userId)

    const post = await this.createPostUseCase.execute(postDto)
    return response.status(201).json(post)
  }

  @Get('/user/:userId')
  async getUserPosts(request: Request, response: Response) {
    const { userId } = request.params
    const posts: PostEntity[] = await this.posts.findByUserId(userId)

    return response.json(posts.map((post) => post.toJSON()))
  }
}
