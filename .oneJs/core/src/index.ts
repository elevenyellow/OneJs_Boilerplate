// Core exports only
export {
  BootstrapBase,
  OneJs,
  PluginRegistry,
  Module,
  type Plugin,
  type BootstrapPlugin,
  type ModuleOptions,
} from './bootstrap'
export { ConfigService } from './config'
export {
  container,
  Container,
  ContainerProvider,
  Inject,
  Injectable,
  metadataRegistry,
} from './container'
export * from './errors'
export { Logger, logger } from './logger'
export { markAs, hasRole, getRoles, clearMarkers, type ModuleRole } from './markers'
export type { ClassConstructor } from './types'

// Auth exports (core feature)
export { AuthPlugin } from './auth/auth-plugin'
export { AUTH_STRATEGY_TOKEN } from './auth/auth-strategy-token'
export { AuthMiddleware } from './auth/auth.middleware'
export { UseAuth } from './auth/decorators/auth-middleware'
export { Roles } from './auth/decorators/roles'
export {
  UserRoles,
  type UserRole,
  type AuthUser,
  type AuthStrategy,
} from './auth/types'
export { LocalJwtStrategy } from './auth/strategies/local-jwt.strategy'
export { ClerkStrategy } from './auth/strategies/clerk.strategy'

// Domain primitives
export { ValueObject as ValueObjectBase } from './domain/value-object'
export { Entity as EntityBase } from './domain/entity'
export { ValueObject, Entity } from './domain/decorators'

