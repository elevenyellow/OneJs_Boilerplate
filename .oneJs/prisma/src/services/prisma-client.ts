import { Injectable } from '@OneJs/core'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaClientOneJs extends PrismaClient {}
