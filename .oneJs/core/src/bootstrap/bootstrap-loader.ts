import type { Container } from '../container'
import { logger } from '../logger'
import { BootstrapBase } from './bootstrap-base'
import type { BootstrapPlugin } from './plugin-registry'
import { getAllBootstraps } from './store'

export class BootstrapLoader implements BootstrapPlugin {
  name = 'bootstrap-loader'
  priority = 10
  dependsOn = ['auto-loader-plugin']
  critical = true

  async load(container: Container): Promise<void> {
    const bootstraps = getAllBootstraps()

    if (bootstraps.length === 0) {
      logger.debug('oneJs:bootstrap', 'No bootstrap services found')
      return
    }

    logger.debug(
      'oneJs:bootstrap',
      `🚀 Loading ${bootstraps.length} bootstrap service(s)...`,
    )

    for (const meta of bootstraps) {
      try {
        const instance = container.get(meta.target)

        if (
          instance instanceof BootstrapBase &&
          typeof instance.bootstrap === 'function'
        ) {
          logger.debug(
            'oneJs:bootstrap',
            `⚡ Running bootstrap: ${meta.target.name}`,
          )
          await instance.bootstrap()
        }
      } catch (err) {
        logger.error(
          'oneJs:bootstrap',
          `❌ Error in ${meta.target.name}.bootstrap(): ${err}`,
        )
      }
    }

    logger.debug('oneJs:bootstrap', '✅ Bootstrap services loaded')
  }
}
