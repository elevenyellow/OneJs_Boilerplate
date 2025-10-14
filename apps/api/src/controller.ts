import { Controller, Get, Inject } from '@OneJs'
import { CreatePostUseCase } from '@post/application/use-cases/create-post.use-case'
import type { Context } from 'elysia'

@Controller('/users')
export class UserController {
  constructor(
    @Inject(CreatePostUseCase)
    private readonly createPostUseCase: CreatePostUseCase,
  ) {}

  //   @UseAuth()
  @Get('/')
  index(context: Context) {
    context.set.status = 200

    return {
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: 30,
    }
  }
}
