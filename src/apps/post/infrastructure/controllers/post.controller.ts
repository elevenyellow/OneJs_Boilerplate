import { Controller, Post, Get, type Request, type Response } from '@EyJs'
import { Inject } from '@EyJs'
import { PostMongoRepository } from '@post/infrastructure/persistance/mongo/post.repository'
import { CreatePostDto } from '@post/domain/dtos/create-post.dto'
import { CreatePostUseCase } from '@post/application/use-cases/create-post.use-case'
import type { PostEntity } from '@post/domain/entities/post'

@Controller('/posts')
export class PostController {
  constructor(
    @Inject(PostMongoRepository) private readonly posts: PostMongoRepository,
    @Inject(CreatePostUseCase) private readonly createPostUseCase: CreatePostUseCase,
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
    const posts: PostEntity[] = await this.posts.findByUserId(userId, {
      populate: true,
    })

    return response.json(posts.map((post) => post.toJSON()))
  }
}
