import { Injectable, Logger } from '@EyJs'
import { Inject } from '@EyJs'

@Injectable()
export class UserService {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async getUser(id: string) {
    // return this.logger.info(`Getting user with id from admin ${id}`)
  }

  onUserCreated(user: any) {
    console.log(user)
  }
}
