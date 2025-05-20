import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { Injectable, Inject, Container } from '../container'
import { Logger } from '../logger'
import { ErrorMiddleware } from './middlewares/error.middleware'
import { getAllControllers } from './decorators'
import { useClassMiddleware } from './utils'

@Injectable()
export class Server {
  private readonly controllers: any[]
  private readonly app: Express
  private middlewares: Array<
    (req: Request, res: Response, next: NextFunction) => void
  >
  public prefix: string
  protected container: Container;

  constructor(
    @Inject(Logger) private readonly logger: Logger,
  ) {
    this.app = express()
    this.app.set('trust proxy', true)
    this.app.use(cors())

    this.controllers = []
    this.middlewares = []
    this.prefix = ''
  }

  setContainer(containerInstance: Container): this {
    this.container = containerInstance
    return this
  }

  private asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch((error) => {
        console.error(error)

        next(error)
      })
    }
  }

  private logClientIp(req: Request, res: Response, next: NextFunction) {
    req.clientIp = req.ip
    next()
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
        `Registering routes for controller ${controllerClass.name}`,
      )

      for (const [handlerName, route] of Object.entries(meta.routes)) {
        const fullPath = `${basePath}${route.path}`.replace(/\/{2,}/g, '/')
        const method = route.method?.toLowerCase()
        if (!method) continue

        const handler = controllerInstance[handlerName].bind(controllerInstance)

        const rawMiddlewares = [...(route.middlewares || [])]

        const resolvedMiddlewares = rawMiddlewares.map((mw: any) => {
          if (typeof mw === 'function' && mw.prototype?.handle) {
            const instance = this.container.get(mw)
            return instance.handle.bind(instance)
          }
          return mw
        })

        if (route.raw || meta.raw) {
          resolvedMiddlewares.unshift(
            bodyParser.urlencoded({ extended: false }),
          )
          resolvedMiddlewares.push(bodyParser.json())
        } else {
          resolvedMiddlewares.unshift(express.json())
        }

        this.logger.debug(
          `Registering route [${method.toUpperCase()}] ${fullPath}`,
        )

        this.app[method](
          fullPath,
          ...resolvedMiddlewares,
          this.asyncHandler(handler),
        )
      }
    })
  }

  addController(controllerClass: any): this {
    this.controllers.push(controllerClass)
    return this
  }

  addControllers(controllerClasses: any[]): this {
    this.controllers.push(...controllerClasses)
    return this
  }

  setPrefix(prefix: string): this {
    this.prefix = prefix
    return this
  }

  addMiddleware(middleware: Function | { new (...args: any[]): any }): this {
    const resolved =
      typeof middleware === 'function' && middleware.prototype?.handle
        ? useClassMiddleware(middleware)
        : middleware

    this.middlewares.push(resolved)
    return this
  }

  addMiddlewares(
    middlewares: Array<Function | { new (...args: any[]): any }>,
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

    this.app.use(this.logClientIp)

    // Registrar middlewares globales
    this.middlewares.forEach((middleware) => this.app.use(middleware))

    const controllers = getAllControllers()

    this.addControllers(controllers)

    // Registrar rutas de controladores
    this.registerRoutes()

    // Error handler al final
    this.app.use(ErrorMiddleware)

    this.app.listen(port, () => {
      this.logger.debug(`🚀 Server listening on port ${port}`)
      callback?.()
    })
  }
}
