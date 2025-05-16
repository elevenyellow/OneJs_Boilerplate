// import express from 'express'
// import { DistributedEventBus } from '../bus/distributed-event-bus'
// import { LoggingMiddleware } from '../middleware/logging.middleware'

// const app = express()
// app.use(express.json())

// const eventBus = new DistributedEventBus()
// eventBus.use(LoggingMiddleware)

// const userService = new UserService(eventBus)

// // Endpoint para crear un usuario
// app.post('/users', async (req, res) => {
//   const { userId } = req.body
//   await userService.createUser(userId)
//   res.status(201).send({ message: 'Usuario creado y evento publicado' })
// })

// // Iniciar el servidor
// app.listen(3000, () => {
//   console.log('Servidor ejecutándose en http://localhost:3000')
// })
