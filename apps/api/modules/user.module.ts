import { Module } from '@OneJs/core'
import { UserRegisteredHandler } from '@user/application/handlers/user-registered.handler'
import { AuthController } from '@user/infrastructure/controllers/auth.controller'

@Module({
  controllers: [AuthController],
  handlers: [UserRegisteredHandler],
})
export class UserModule {}
