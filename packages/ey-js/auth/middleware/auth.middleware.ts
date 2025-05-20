import { Injectable } from '@EyJs'
import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { EyJsError } from '@EyJs'

@Injectable()
export class AuthMiddleware {
  async handle(req: Request, res: Response, next: NextFunction) {
    const auth = req.headers.authorization

    if (!auth?.startsWith('Bearer ')) {
      throw new EyJsError('Unauthorized', 401, 'Bearer token is required')
    }

    try {
      const token = auth.replace('Bearer ', '')
      const decoded = jwt.verify(token, process.env.JWT_SECRET!)
      req.user = decoded
      next()
    } catch {
      throw new EyJsError('Unauthorized', 401, 'Invalid token')
    }
  }
}
