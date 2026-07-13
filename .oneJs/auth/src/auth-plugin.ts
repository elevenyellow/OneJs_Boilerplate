import type { BootstrapPlugin, ClassConstructor, Container } from '@OneJs/core'
import { logger } from '@OneJs/core'
import { AUTH_STRATEGY_TOKEN } from './auth-strategy-token'
import { LocalJwtStrategy } from './strategies/local-jwt.strategy'
import type { AuthStrategy } from './types'

export class AuthPlugin implements BootstrapPlugin {
  name = 'auth-plugin'
  priority = 20

  constructor(private readonly strategy?: ClassConstructor<AuthStrategy>) {}

  register(container: Container): void {
    const strategyClass = this.strategy ?? LocalJwtStrategy
    container.registerAlias(AUTH_STRATEGY_TOKEN, strategyClass)
    logger.debug(
      'oneJs:auth',
      `📝 AuthPlugin registered (strategy: ${strategyClass.name})`,
    )
  }
}
