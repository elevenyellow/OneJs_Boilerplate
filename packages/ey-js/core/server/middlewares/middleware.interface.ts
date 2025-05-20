import type { NextFunction, Request, Response } from 'express'

export interface MiddlewareInterface {
  handle(req: Request, res: Response, next: NextFunction): void
}

export interface MiddlewareClassInterface {
  new (...args: any[]): MiddlewareInterface
}
