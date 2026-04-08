import type { Container } from '../container'
import { logger } from '../logger'
import { GlobModuleLoader } from './adapters/GlobModuleLoader'
import type { AutoLoaderOptions, IModuleLoader } from './ports/IModuleLoader'
import type { BootstrapPlugin } from './plugin-registry'

export type { AutoLoaderOptions } from './ports/IModuleLoader'

export class AutoLoaderPlugin implements BootstrapPlugin {
  name = 'auto-loader-plugin'
  priority = 5
  critical = true

  constructor(
    private readonly options: AutoLoaderOptions,
    private readonly loader: IModuleLoader = new GlobModuleLoader(),
  ) {}

  register(_container: Container): void {
    logger.debug('oneJs:loader', '📝 AutoLoader plugin registered')
  }

  async load(_container: Container): Promise<void> {
    await this.loader.load(this.options)
  }
}
