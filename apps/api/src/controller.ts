import { Controller, Get, Inject } from '@EyJs'
// import { UserService } from './user/application/user.service'
import { CreatePostUseCase } from '@post/application/use-cases/create-post.use-case'
import type { Response } from 'express'

@Controller('/')
export class UserController {
  constructor(
    @Inject(CreatePostUseCase)
    private readonly createPostUseCase: CreatePostUseCase,
  ) {}

  @Get('/')
  index(request: Request, response: Response) {
    console.log(this.createPostUseCase)
    return response.json({ message: 'Hello World' })
  }
}
