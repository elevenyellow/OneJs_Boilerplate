import { Inject } from '@OneJs/core'
import { Controller, Get, Post } from '@OneJs/server'
import { CreateUserUseCase } from '@user/application/use-cases/create-user.use-case'
import { CreateUserDto } from '@user/domain/dtos/create-user.dto'
import { UserPrismaRepository } from '@user/infrastructure/persistence/prisma/user.repository'

@Controller('/users')
export class UserController {
  constructor(
    @Inject(UserPrismaRepository)
    private readonly usersRepository: UserPrismaRepository,
    @Inject(CreateUserUseCase)
    private readonly createUserUseCase: CreateUserUseCase,
  ) {}

  @Post('/sign-up')
  async signUp(request: Request, response: Response) {
    const { email, name, password } = request.body
    const userDto = CreateUserDto.create(email, name, password)
    const user = await this.createUserUseCase.execute(userDto)

    return response.status(201).json(user)
  }

  // @UseMiddleware(AuthMiddleware)
  @Get('/:id')
  async getUser(request: Request, response: Response) {
    console.log('Get user handler called', { user: request.user }) // Debug log
    const { id } = request.params
    const user = await this.usersRepository.findById(id)

    if (!user) {
      return response.status(404).json({ message: 'User not found' })
    }

    return response.status(200).json(user)
  }
}
