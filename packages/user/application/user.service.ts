import { Inject, Injectable } from '@OneJs/core'
import { UserPrismaRepository } from '@user/infrastructure/persistence/prisma/user.repository'

@Injectable()
export class UserService {
  constructor(
    @Inject(UserPrismaRepository)
    private userPrismaRepository: UserPrismaRepository,
  ) {}

  public async hi() {
    console.log('hi')
  }
}
