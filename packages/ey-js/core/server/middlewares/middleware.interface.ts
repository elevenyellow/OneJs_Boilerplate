import type { Context } from 'elysia'

export type ElysiaContext = Context
export interface MiddlewareInterface {
  handle(context: ElysiaContext): Promise<void> | void
}

export interface MiddlewareClassInterface {
  new (...args: any[]): MiddlewareInterface
}
