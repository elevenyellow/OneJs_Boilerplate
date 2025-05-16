import { PrismaClient } from '@prisma/client'
import { Injectable } from '@EyJs'

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super()
  }
}
