import type { ClassConstructor } from '../types'
import { logger } from '../logger'
import type { BootstrapPlugin, Container } from '../bootstrap'
import type { AuthStrategy } from './types'
import { LocalJwtStrategy } from './strategies/local-jwt.strategy'
import { AUTH_STRATEGY_TOKEN } from './auth-strategy-token'

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
