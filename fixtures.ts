// import { AutoLoader, ConfigService, container } from '@EyJs'
// import { UserMongoRepository } from '@user/infrastructure/mongo/user.repository'
// import { PostMongoRepository } from '@post/infrastructure/persistance/mongo/post.repository'
// import { UserEntity } from '@user/domain/entities/user.entity'
// import { PostEntity } from '@post/domain/entities/post'
// import { MongoConnector } from '@EyJs/Mongo'

// const config = container.get(ConfigService)

// const mongoConnector = container.get(MongoConnector)

// await mongoConnector.connect(config.get('MONGO_URL') as string)
// await AutoLoader.init()

// const userRepo = container.get(UserMongoRepository)
// const postRepo = container.get(PostMongoRepository)

// async function createFixtures() {
//   // 1. Crear el usuario como entidad de dominio
//   const user = new UserEntity('Sahar', 'sahar@eyjs.dev', [])
//   const createdUser = await userRepo.createEntity(user)

//   // 2. Crear los posts como entidades
//   const post1 = new PostEntity('Primer post', 'Hola mundo', createdUser.id!)
//   const createdPost1 = await postRepo.createEntity(post1)

//   const post2 = new PostEntity('Segundo post', 'EyJs FTW', createdUser.id!)
//   const createdPost2 = await postRepo.createEntity(post2)

//   // 3. Actualizar el usuario con los postIds desde la lógica de dominio
//   createdUser.addPost(createdPost1.id!)
//   createdUser.addPost(createdPost2.id!)

//   // 4. Persistir el usuario actualizado
//   await userRepo.updateEntity(createdUser)
// }

// export function getUser(id: string) {
//   return userRepo.findOneById(id, { populate: true })
// }

// // createFixtures()

// const user = await getUser('6825d235c0f4c22dfc3e3e78')
// console.log(user)
// const postId = '6825d236c0f4c22dfc3e3e7a'

// //
// const post = await postRepo.findOneById(postId, { populate: true })
// console.log(post)
