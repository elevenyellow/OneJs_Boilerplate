import type { Context, Elysia } from 'elysia'

// Tu interfaz base para middlewares en clases
export interface MiddlewareInterface {
  handle(context: Context, roles?: unknown[]): Promise<void> | void
}

// Clase que implementa esa interfaz
export type MiddlewareClass = new (...args: unknown[]) => MiddlewareInterface

// Plugin tipo Elysia (como cors())
export type ElysiaPlugin = Elysia<
  '',
  {
    decorator: {}
    store: {}
    derive: {}
    resolve: {}
  },
  {
    typebox: {}
    error: {}
  },
  {
    schema: {}
    standaloneSchema: {}
    macro: {}
    macroFn: {}
    parser: {}
  },
  {},
  {
    derive: {}
    resolve: {}
    schema: {}
    standaloneSchema: {}
  },
  {
    derive: {}
    resolve: {}
    schema: {}
    standaloneSchema: {}
  }
>

// Plugin factory/function compatible with app.use(plugin)
export type ElysiaPluginFactory = (app: Elysia) => Elysia | Promise<Elysia>

// Tipo unificado para aceptar todos
// Solo acepta clases o funciones que devuelven Elysia
export type AnyMiddleware =
  | MiddlewareInterface
  | MiddlewareClass
  | ElysiaPlugin
  | ElysiaPluginFactory
