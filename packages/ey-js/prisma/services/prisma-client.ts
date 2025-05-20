import { PrismaClient } from '@prisma/client'
import { Injectable } from '@EyJs'

@Injectable()
export class PrismaClientEy extends PrismaClient {}
