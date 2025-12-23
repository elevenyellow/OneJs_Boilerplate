// Core exports only
export { OneJs, PluginRegistry, type BootstrapPlugin } from './bootstrap'
export { ConfigService } from './config'
export {
  Container,
  ContainerProvider,
  Inject,
  Injectable,
  metadataRegistry,
} from './container'
export * from './errors'
export { Logger, logger } from './logger'
export type { ClassConstructor } from './types'

// Auth exports (core feature)
export { AuthMiddleware } from './auth/auth.middleware'
export { UseAuth } from './auth/decorators/auth-middleware'
export { Roles } from './auth/decorators/roles'
export { UserRoles, type UserRole, type AuthUser, type AuthStrategy } from './auth/types'
export { LocalJwtStrategy } from './auth/strategies/local-jwt.strategy'
export { ClerkStrategy } from './auth/strategies/clerk.strategy'

// Prisma exports (core feature)
export { PrismaClientOneJs } from './prisma-client'
export { PrismaRepository } from './repositories/base.repository'