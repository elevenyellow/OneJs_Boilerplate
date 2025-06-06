import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { Injectable, Inject, Container } from '../container'
import { Logger } from '../logger'
import { getAllControllers } from './decorators'
import { EyJsError } from './ey-js.error'
import { createErrorResponse, createSuccessResponse } from './types/response'
import { ElysiaContext, MiddlewareInterface } from './middlewares'

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
  private readonly controllers: ControllerClass[]
  private readonly app: Elysia
  private middlewares: any[]
  public prefix: string
  protected container: Container;

  constructor(
    @Inject(Logger) private readonly logger: Logger,
  ) {
    this.app = new Elysia()
    this.app.use(cors())

    this.controllers = []
    this.middlewares = []
    this.prefix = ''
  }

  setContainer(containerInstance: Container): this {
    this.container = containerInstance
    return this
  }

  // private asyncHandler(fn: ElysiaMiddleware): ElysiaMiddleware {
  //   return async (context: ElysiaContext) => {
  //     console.log('asyncHandler', fn)

  //     try {
  //       await Promise.resolve(fn(context))
  //     } catch (error) {
  //       console.error(error)
  //       throw error
  //     }
  //   }
  // }

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
        `Registering routes for controller ${controllerClass.name}`,
      )

      for (const [handlerName, route] of Object.entries(meta.routes)) {
        const fullPath = `${basePath}${route.path}`.replace(/\/{2,}/g, '/')
        const method = route.method?.toLowerCase()
        if (!method) continue

        const handler = controllerInstance[handlerName].bind(controllerInstance)

        const rawMiddlewares = [...(route.middlewares || [])]

        const resolvedMiddlewares = rawMiddlewares.map((mw) => {
          if (typeof mw === 'function' && mw.prototype?.handle) {
            const instance = this.container.get(mw)
            return instance.handle.bind(instance)
          }
          return mw
        })

        this.logger.debug(
          `Registering route [${method.toUpperCase()}] ${fullPath}`,
        )

        // Pass the original Elysia context to the handler
        const elysiaHandler = async (context: ElysiaContext) => {
          try {
            const result = await handler(context)

            if (result !== undefined) {
              context.body = result
            }

            // Store the original response
            const originalResponse = context.body

            // Format the response
            const formattedResponse = createSuccessResponse(originalResponse)

            // Set the response and return it
            context.body = formattedResponse
            return formattedResponse
          } catch (error) {
            this.logger.error('Error in controller handler:', error)
            throw error
          }
        }

        this.app[method](fullPath, ...resolvedMiddlewares, elysiaHandler)
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

  addMiddleware(
    middleware: MiddlewareInterface | { new (...args: any[]): any },
  ): this {
    // const resolved =
    //   typeof middleware === 'function' && middleware.prototype?.handle
    //     ? useClassMiddleware(middleware)
    //     : middleware

    this.middlewares.push(middleware as ElysiaMiddleware)
    return this
  }

  addMiddlewares(
    middlewares: Array<ElysiaMiddleware | { new (...args: any[]): any }>,
  ): this {
    middlewares.forEach((middleware) => this.addMiddleware(middleware))
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
      return createErrorResponse('Not Found', 404)
    })

    // Error handler
    this.app.onError(({ code, error, set }) => {
      const isDevelopment = process.env.NODE_ENV === 'development'
      const isEyJsError = error instanceof EyJsError

      const status = isEyJsError ? error.statusCode : 500
      const message = isDevelopment
        ? error instanceof Error
          ? error.message
          : 'Unknown error'
        : isEyJsError
          ? error.message
          : 'Internal Server Error'

      this.logger.error('Server error:', {
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          status,
          code,
        },
      })

      set.status = status
      return createErrorResponse(
        message,
        status,
        isDevelopment
          ? isEyJsError
            ? error.explanatoryMessage
            : error instanceof Error
              ? error.message
              : 'Unknown error'
          : undefined,
      )
    })

    this.app.listen(port, () => {
      this.logger.debug(`🚀 Server listening on port ${port}`)
      callback?.()
    })
  }
}
