import { Controller, Get, Inject } from '@EyJs'
import { UserService } from './service'

@Controller('/admin')
export class AdminController {
  constructor(
    @Inject(UserService) private readonly userService: UserService,
  ) {}

  @Get('/')
  index() {
    return res.json({ message: 'Hello World' })
  }

  @Get('/user')
  user(req: Request, res: Response) {
    return res.json({ message: 'Hello World' })
  }
}
