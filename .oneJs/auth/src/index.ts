// @OneJs/auth - Authentication module exports

export { AuthMiddleware } from './auth.middleware'
export { AuthPlugin } from './auth-plugin'
export { AUTH_STRATEGY_TOKEN } from './auth-strategy-token'
export { UseAuth } from './decorators/auth-middleware'
export { Roles } from './decorators/roles'
export { ClerkStrategy } from './strategies/clerk.strategy'
export { LocalJwtStrategy } from './strategies/local-jwt.strategy'
export {
  type AuthStrategy,
  type AuthUser,
  type UserRole,
  UserRoles,
} from './types'
