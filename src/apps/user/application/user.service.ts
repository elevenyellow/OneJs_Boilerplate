import { Inject, Injectable } from '@EyJs'
import { UserMongoRepository } from '@user/infrastructure/mongo/user.repository'

@Injectable()
export class UserService {
  constructor(
    @Inject(UserMongoRepository) private userMongoRepository: UserMongoRepository,
  ) {}

  public async hi() {
    const test = await this.userMongoRepository.findByEmail('test@test.com')

    console.log({ test })

    return test
  }
}
