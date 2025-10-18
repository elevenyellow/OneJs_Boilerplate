import { PrismaClient } from '@prisma/client'
import { Injectable } from './container/decorators'

@Injectable()
export class PrismaClientEy extends PrismaClient {}
