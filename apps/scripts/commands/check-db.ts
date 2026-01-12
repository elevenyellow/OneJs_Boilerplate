// import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient()

// async function main() {
//   // Check if Jérica crag exists
//   const crag = await prisma.crag.findUnique({
//     where: { externalId: BigInt(102885390) },
//   })

//   console.log('Jérica crag:', crag ? `Found: ${crag.name}` : 'Not found')

//   if (crag) {
//     // Count areas
//     const areasCount = await prisma.area.count({
//       where: { cragId: crag.id },
//     })
//     console.log(`Areas: ${areasCount}`)

//     // List areas
//     const areas = await prisma.area.findMany({
//       where: { cragId: crag.id },
//       select: {
//         name: true,
//         type: true,
//         externalId: true,
//         _count: {
//           select: { sectors: true },
//         },
//       },
//     })

//     console.log('\nAreas:')
//     areas.forEach((area) => {
//       console.log(
//         `  - ${area.name} (${area.type}) [${area.externalId}] - ${area._count.sectors} sectores`,
//       )
//     })
//   }

//   await prisma.$disconnect()
// }

// main()
