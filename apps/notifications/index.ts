import { logger, OneJs } from '@OneJs/core'
import { AutoLoaderPlugin, BootstrapLoader } from '@OneJs/core/bootstrap'
import { EventBusPlugin, RedisBridge } from '@OneJs/event-bus'

await new OneJs()
  .use(new AutoLoaderPlugin({ rootDir: import.meta.dir }))
  .use(new BootstrapLoader())
  .use(new EventBusPlugin(new RedisBridge()))
  .start()

logger.info(
  'notifications:startup',
  'Notifications app listening for integration events via Redis',
)
