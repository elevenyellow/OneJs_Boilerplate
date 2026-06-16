// Core exports only

export { AuthMiddleware } from './auth/auth.middleware'
// Auth exports (core feature)
export { AuthPlugin } from './auth/auth-plugin'
export { AUTH_STRATEGY_TOKEN } from './auth/auth-strategy-token'
export { UseAuth } from './auth/decorators/auth-middleware'
export { Roles } from './auth/decorators/roles'
export { ClerkStrategy } from './auth/strategies/clerk.strategy'
export { LocalJwtStrategy } from './auth/strategies/local-jwt.strategy'
export {
  type AuthStrategy,
  type AuthUser,
  type UserRole,
  UserRoles,
} from './auth/types'
export {
  BootstrapBase,
  type BootstrapPlugin,
  Module,
  type ModuleOptions,
  OneJs,
  type Plugin,
  PluginRegistry,
} from './bootstrap'
export { ConfigService } from './config'
export {
  Container,
  ContainerProvider,
  container,
  Inject,
  Injectable,
  metadataRegistry,
} from './container'
export { Entity, ValueObject } from './domain/decorators'
export { Entity as EntityBase } from './domain/entity'
// Domain primitives
export { ValueObject as ValueObjectBase } from './domain/value-object'
export * from './errors'
export { Logger, logger } from './logger'
export {
  clearMarkers,
  getRoles,
  hasRole,
  type ModuleRole,
  markAs,
} from './markers'
export type { ClassConstructor } from './types'
