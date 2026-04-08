import { Elysia, type Context } from 'elysia'
import {
  type AnyMiddleware,
  type MiddlewareClass,
  type MiddlewareInterface,
} from './middlewares'
import { createErrorResponse, createSuccessResponse } from './types/response'
import { getAllControllers } from './controller-registry'
import {
  Container,
  Inject,
  Injectable,
  Logger,
  type ClassConstructor,
  OneJsError,
  container,
} from '@OneJs/core'

const HTTP_METHOD_GET = 'get'
const HTTP_METHOD_POST = 'post'
const HTTP_METHOD_PUT = 'put'
const HTTP_METHOD_PATCH = 'patch'
const HTTP_METHOD_DELETE = 'delete'
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500
const HTTP_STATUS_NOT_FOUND = 404

const SUPPORTED_HTTP_METHODS = [
  HTTP_METHOD_GET,
  HTTP_METHOD_POST,
  HTTP_METHOD_PUT,
  HTTP_METHOD_PATCH,
  HTTP_METHOD_DELETE,
] as const

type ElysiaPlugin = (app: Elysia) => Elysia
type ElysiaUseInput = Parameters<Elysia['use']>[0]

interface RouteMeta {
  method?: string
  path?: string
  version?: string
  middlewares?: Array<MiddlewareClass | ElysiaPlugin>
  raw?: boolean
  roles?: unknown[]
}

interface ControllerMeta {
  path?: string
  version?: string
  routes: Record<string, RouteMeta>
}

interface ControllerClass {
  __meta?: ControllerMeta
  new (...args: unknown[]): unknown
}

type EnhancedContext = Context & { query: Record<string, string | undefined> }
type SupportedHttpMethod = (typeof SUPPORTED_HTTP_METHODS)[number]

@Injectable()
export class Server {
  private readonly controllers: ControllerClass[] = []
  private readonly app: Elysia = new Elysia()
  private middlewares: ElysiaUseInput[] = []
  public prefix: string = ''
  protected container: Container = container

  constructor(@Inject(Logger) private readonly logger: Logger) {
    this.app.onError(({ error }) => this.handleGlobalError(error))
  }

  private handleGlobalError(error: unknown): Response {
    if (error instanceof OneJsError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: error.message,
          data: error.data ?? {},
          timestamp: new Date().toISOString(),
          error: {
            statusCode: error.statusCode,
            message: error.explanatoryMessage,
            code: error.code,
          },
        }),
        {
          status: error.statusCode,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal Server Error',
        data: {},
        timestamp: new Date().toISOString(),
        error: { statusCode: HTTP_STATUS_INTERNAL_SERVER_ERROR },
      }),
      {
        status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  private resolveMiddlewarePlugins(
    middlewares: RouteMeta['middlewares'] = [],
    roles: RouteMeta['roles'] = [],
  ): ElysiaPlugin[] {
    return middlewares.map((mw) => {
      if (typeof mw === 'function' && mw.prototype?.handle) {
        const instance = this.container.get(mw as ClassConstructor)
        return (app: Elysia) =>
          app.onBeforeHandle(async (context) => {
            await instance.handle(context, roles)
          })
      }
      return mw as ElysiaPlugin
    })
  }

  private buildScopedApp(middlewarePlugins: ElysiaPlugin[]): Elysia {
    let scopedApp = new Elysia()
    for (const plugin of middlewarePlugins) {
      scopedApp = scopedApp.use(plugin)
    }
    return scopedApp
  }

  private ensureQueryParams(context: EnhancedContext): void {
    if (context.query && Object.keys(context.query).length > 0) return
    const url = new URL(context.request.url)
    const queryParams: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value
    })
    context.query = queryParams
  }

  private createRouteHandler(
    handler: (context: Context) => Promise<unknown> | unknown,
  ) {
    return async (context: Context) => {
      try {
        this.ensureQueryParams(context as EnhancedContext)
        const result = await handler(context)
        if (result !== undefined) context.body = result
        const formatted = createSuccessResponse(context.body)
        context.body = formatted
        return formatted
      } catch (error) {
        this.logger.error('oneJs:server', 'Error in controller handler', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        throw error
      }
    }
  }

  private isSupportedHttpMethod(method: string): method is SupportedHttpMethod {
    return SUPPORTED_HTTP_METHODS.includes(method as SupportedHttpMethod)
  }

  private registerRoute(
    scopedApp: Elysia,
    method: SupportedHttpMethod,
    fullPath: string,
    handler: (context: Context) => Promise<unknown>,
  ): void {
    switch (method) {
      case HTTP_METHOD_GET:
        scopedApp.get(fullPath, handler)
        break
      case HTTP_METHOD_POST:
        scopedApp.post(fullPath, handler)
        break
      case HTTP_METHOD_PUT:
        scopedApp.put(fullPath, handler)
        break
      case HTTP_METHOD_PATCH:
        scopedApp.patch(fullPath, handler)
        break
      case HTTP_METHOD_DELETE:
        scopedApp.delete(fullPath, handler)
        break
    }
  }

  private registerControllerRoutes(controllerClass: ControllerClass): void {
    const meta = controllerClass.__meta
    if (!meta?.routes) return

    const controllerInstance = this.container.get(controllerClass)
    const controllerRecord = controllerInstance as Record<string, unknown>
    const basePath = `${meta.version || this.prefix}${meta.path}`.replace(
      /\/{2,}/g,
      '/',
    )

    this.logger.info(
      `Registering routes for controller ${controllerClass.name}`,
    )

    for (const [handlerName, route] of Object.entries(meta.routes)) {
      const method = route.method?.toLowerCase()
      if (!method || !this.isSupportedHttpMethod(method)) continue

      const fullPath = `${basePath}${route.path}`.replace(/\/{2,}/g, '/')
      const controllerHandler = controllerRecord[handlerName]
      if (typeof controllerHandler !== 'function') continue
      const handler = controllerHandler.bind(controllerInstance)
      const middlewarePlugins = this.resolveMiddlewarePlugins(
        route.middlewares,
        route.roles,
      )
      const scopedApp = this.buildScopedApp(middlewarePlugins)

      this.logger.info(
        `Registering route [${method.toUpperCase()}] ${fullPath}`,
      )

      this.registerRoute(
        scopedApp,
        method,
        fullPath,
        this.createRouteHandler(handler),
      )

      this.app.use(scopedApp)
    }
  }

  private registerRoutes(): void {
    this.controllers.forEach((c) => this.registerControllerRoutes(c))
  }

  private hasController(controllerClass: ControllerClass): boolean {
    return this.controllers.includes(controllerClass)
  }

  setContainer(containerInstance: Container): this {
    this.container = containerInstance
    return this
  }

  addController(controllerClass: ControllerClass): this {
    if (!this.hasController(controllerClass)) {
      this.controllers.push(controllerClass)
    }
    return this
  }

  addControllers(controllerClasses: ControllerClass[]): this {
    controllerClasses.forEach((controllerClass) => {
      this.addController(controllerClass)
    })
    return this
  }

  setPrefix(prefix: string): this {
    this.prefix = prefix
    return this
  }

  use(middleware: AnyMiddleware): this {
    const resolved: ElysiaUseInput =
      typeof middleware === 'function' && middleware.prototype?.handle
        ? (app: Elysia) => {
            const middlewareClass = middleware as MiddlewareClass
            const instance = this.container.get(
              middlewareClass as ClassConstructor,
            )
            return app.onBeforeHandle(async (context) => {
              await instance.handle(context, [])
            })
          }
        : (middleware as ElysiaUseInput)
    this.middlewares.push(resolved)
    return this
  }

  addMiddlewares(
    middlewares: Array<MiddlewareInterface | MiddlewareClass>,
  ): this {
    middlewares.forEach((m) => this.use(m))
    return this
  }

  start(port = 3000, callback?: () => void): void {
    this.middlewares.forEach((m) => this.app.use(m))
    if (this.controllers.length === 0) {
      this.addControllers(getAllControllers())
    }
    this.registerRoutes()

    this.app.all('*', ({ set }) => {
      set.status = HTTP_STATUS_NOT_FOUND
      return new Response(
        JSON.stringify(createErrorResponse('Not Found', HTTP_STATUS_NOT_FOUND)),
        {
          status: HTTP_STATUS_NOT_FOUND,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    })

    this.app.listen(port, () => {
      this.logger.debug('oneJs:server', `🚀 Server listening on port ${port}`)
      callback?.()
    })
  }
}
