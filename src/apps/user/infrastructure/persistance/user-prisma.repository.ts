// import { PrismaRepository, PrismaService } from '@EyJs/Prisma'
// import { Injectable, Inject } from '@EyJs'

// @Injectable()
// export class UserRepository extends PrismaRepository<'user'> {
//   constructor(@Inject(PrismaService) prisma: PrismaService) {
//     super(prisma, 'user')
//   }

//   findByEmail(email: string) {
//     return this.model.findUnique({ where: { email } })
//   }

//   findActiveUsers() {
//     return this.model.findMany({ where: { isActive: true } })
//   }
// }
