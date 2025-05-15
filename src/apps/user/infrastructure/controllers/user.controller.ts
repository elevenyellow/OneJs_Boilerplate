import { Controller, Get, type Request, type Response } from '@EyJs'
import { Inject } from '@EyJs'
import { UserMongoRepository } from '@user/infrastructure/mongo/user.repository'
import { populateMany } from '@EyJs/Mongo'

@Controller('/users')
export class UserController {
  constructor(@Inject(UserMongoRepository) private readonly users: UserMongoRepository) {}

  @Get('/')
  async getAll(req: Request, res: Response) {
    const rawUsers = await this.users.findAll()
    const hydrated = await populateMany(rawUsers)

    res.json(hydrated)
  }
}
