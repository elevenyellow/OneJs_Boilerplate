import { AutoLoader, container, Server } from '@EyJs'

await AutoLoader.init()

container
  .get(Server)
  .setPrefix('/api')
  .start(3000, function () {
    console.log('Server is running on port 3000')
  })
