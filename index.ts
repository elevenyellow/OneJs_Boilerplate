import { AutoLoader, ConfigService, container, Server } from '@EyJs'
import { MongoConnector } from '@EyJs/Mongo'

const config = container.get(ConfigService)

const mongoConnector = container.get(MongoConnector)

await mongoConnector.connect(config.get('MONGO_URL') as string)
await AutoLoader.init()

container
  .get(Server)
  .setPrefix('/api')
  .start(3000, function () {
    console.log('Server is running on port 3000')
  })
