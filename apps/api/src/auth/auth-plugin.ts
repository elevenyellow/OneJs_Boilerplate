import type { BootstrapPlugin } from '@OneJs/core'
import { ContainerProvider } from '@OneJs/core'
import { SyncUserPostProcessor } from './sync-user.post-processor'

/**
 * Plugin to register the AuthPostProcessor for syncing Clerk users
 */
export class AuthPlugin implements BootstrapPlugin {
  name = 'auth-plugin'
  priority = 80 // Run after services are registered

  register(): void {
    // Nothing to register here, services are auto-registered
  }

  async load(): Promise<void> {
    const container = ContainerProvider.getContainer()
    
    // Register the SyncUserPostProcessor as the AuthPostProcessor
    container.registerAlias('AuthPostProcessor', SyncUserPostProcessor)
  }
}
