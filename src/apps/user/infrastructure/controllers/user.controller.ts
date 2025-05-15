import { Controller, Get, Post, type Request, type Response } from '@EyJs'
import { Inject } from '@EyJs'
import { UserMongoRepository } from '@user/infrastructure/mongo/user.repository'
import { CreateUserDto } from '@user/domain/dtos/create-user.dto'
import { CreateUserUseCase } from '@user/application/use-cases/create-user.use-case'

@Controller('/users')
export class UserController {
  constructor(
    @Inject(UserMongoRepository) private readonly users: UserMongoRepository,
    @Inject(CreateUserUseCase) private readonly createUserUseCase: CreateUserUseCase,
  ) {}

  @Post('/sign-up')
  async signUp(request: Request, response: Response) {
    // TODO GET FROM REQUEST BODY
    const userDto = CreateUserDto.create(
      'test@test.com',
      'Test',
      'pASSw0rdAbc123.',
    )

    const user = await this.createUserUseCase.execute(userDto)
    return response.status(201).json(user)
  }

  @Get('/:id')
  async getUser(request: Request, response: Response) {
    const { id } = request.params
    const user = await this.users.findOneById(id, { populate: true })
    return response.status(200).json(user)
  }
}
