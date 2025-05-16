import {
  Controller,
  Get,
  Post,
  UseMiddleware,
  type Request,
  type Response,
} from '@EyJs'
import { AuthMiddleware } from '@EyJs/Auth'
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
    const { email, name, password } = request.body
    const userDto = CreateUserDto.create(email, name, password)
    const user = await this.createUserUseCase.execute(userDto)
    return response.status(201).json(user)
  }

  @UseMiddleware(AuthMiddleware)
  @Get('/:id')
  async getUser(request: Request, response: Response) {
    console.log('Get user handler called', { user: request.user }) // Debug log
    const { id } = request.params
    const user = await this.users.findOneById(id, { populate: true })
    if (!user) {
      return response.status(404).json({ message: 'User not found' })
    }
    return response.status(200).json(user)
  }
}
