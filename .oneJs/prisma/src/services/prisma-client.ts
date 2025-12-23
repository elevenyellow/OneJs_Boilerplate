import { PrismaClient } from '@prisma/client'
import { Injectable } from '@OneJs'

@Injectable()
export class PrismaClientOneJs extends PrismaClient {}
