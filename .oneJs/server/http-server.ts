import { Elysia, type Context } from 'elysia'
import {
  Container,
  container,
  Inject,
  Injectable,
  type ClassConstructor,
} from '../container'
import { Logger } from '../logger'
import { getAllControllers } from './decorators'
import { EyJsError } from './ey-js.error'
import { type AnyMiddleware, type MiddlewareInterface } from './middlewares'
import { createErrorResponse, createSuccessResponse } from './types/response'
import { useClassMiddleware } from './utils'

interface RouteMeta {
  method?: string
  path?: string
  version?: string
  middlewares?: Array<Function | { new (...args: any[]): any }>
  raw?: boolean
}

interface ControllerMeta {
  path?: string
  version?: string
  routes: Record<string, RouteMeta>
}

interface ControllerClass {
  __meta?: ControllerMeta
  new (...args: any[]): any
}

@Injectable()
export class Server {
  private readonly controllers: ControllerClass[] = []
  private readonly app: Elysia = new Elysia()
  private middlewares: AnyMiddleware[] = []
  public prefix: string = ''
  protected container: Container = container

  constructor(@Inject(Logger) private readonly logger: Logger) {
    // Error handler
    this.app.onError(({ error }) => {
      if (error instanceof EyJsError) {
        return error.toResponse()
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Internal Server Error',
          data: {},
          timestamp: new Date().toISOString(),
          error: {
            statusCode: 500,
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    })
  }

  setContainer(containerInstance: Container): this {
    this.container = containerInstance
    return this
  }

  private registerRoutes(): void {
    this.controllers.forEach((controllerClass) => {
      const controllerInstance = this.container.get(controllerClass)
      const meta = controllerClass.__meta
      if (!meta || !meta.routes) return

      const basePath = `${meta.version || this.prefix}${meta.path}`.replace(
        /\/{2,}/g,
        '/',
      )

      this.logger.debug(
        'oneJs:server',
        `Registering routes for controller ${controllerClass.name}`,
      )

      for (const [handlerName, route] of Object.entries(meta.routes)) {
        const fullPath = `${basePath}${route.path}`.replace(/\/{2,}/g, '/')
        const method = route.method?.toLowerCase()
        if (!method) continue

        const handler = controllerInstance[handlerName].bind(controllerInstance)

        const rawMiddlewares = [...(route.middlewares || [])]

        // Convert class-based middlewares to Elysia plugins
        const middlewarePlugins = rawMiddlewares.map((mw) => {
          if (typeof mw === 'function' && mw.prototype?.handle) {
            const instance = this.container.get(mw as ClassConstructor)

            return (app: Elysia) =>
              app.onBeforeHandle(async (context) => {
                await instance.handle(context)
              })
          }

          // If it’s already a plugin, return it directly
          return mw
        })

        // Construct scoped app with plugins
        let scopedApp = new Elysia()

        for (const plugin of middlewarePlugins) {
          if (typeof plugin === 'function') {
            scopedApp = scopedApp.use(plugin)
          }
        }

        // Register the route handler with the plugin-applied instance
        this.logger.debug(
          'oneJs:server',
          `Registering route [${method.toUpperCase()}] ${fullPath}`,
        )

        scopedApp[method as 'get' | 'post' | 'put' | 'delete'](
          fullPath,
          async (context: Context) => {
            try {
              const result = await handler(context)

              if (result !== undefined) {
                context.body = result
              }

              const formattedResponse = createSuccessResponse(context.body)
              context.body = formattedResponse
              return formattedResponse
            } catch (error) {
              this.logger.error(`Error in controller handler: `, { error })
              throw error
            }
          },
        )

        // Mount the scoped app onto the main app
        this.app.use(scopedApp)
      }
    })
  }

  addController(controllerClass: ControllerClass): this {
    this.controllers.push(controllerClass)
    return this
  }

  addControllers(controllerClasses: ControllerClass[]): this {
    this.controllers.push(...controllerClasses)
    return this
  }

  setPrefix(prefix: string): this {
    this.prefix = prefix
    return this
  }

  use(middleware: AnyMiddleware): this {
    const resolved =
      typeof middleware === 'function' && middleware.prototype?.handle
        ? useClassMiddleware(middleware)
        : middleware

    this.middlewares.push(resolved)
    return this
  }

  addMiddlewares(
    middlewares: Array<
      MiddlewareInterface | { new (...args: any[]): MiddlewareInterface }
    >,
  ): this {
    middlewares.forEach((middleware) => this.use(middleware))
    return this
  }

  start(port = 3000, callback?: () => void): void {
    if (!this.container) {
      throw new Error(
        'Container not set. Use .setContainer(container) before start()',
      )
    }

    // Register global middlewares
    this.middlewares.forEach((middleware) => {
      this.app.use(middleware)
    })

    const controllers = getAllControllers()
    this.addControllers(controllers)

    // Register controller routes
    this.registerRoutes()

    // Add catch-all route for 404s
    this.app.all('*', ({ set }) => {
      set.status = 404
      return new Response(
        JSON.stringify(createErrorResponse('Not Found', 404)),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    })

    this.app.listen(port, () => {
      this.logger.debug('oneJs:server', `🚀 Server listening on port ${port}`)
      callback?.()
    })
  }
}
