import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const externalId = BigInt(102885390) // Jérica

  // Find the crag
  const crag = await prisma.crag.findUnique({
    where: { externalId },
  })

  if (!crag) {
    console.log('Crag not found')
    return
  }

  console.log(`Deleting crag: ${crag.name}`)

  // Delete in order (respecting FK constraints)
  
  // 1. Delete routes
  const routesDeleted = await prisma.route.deleteMany({
    where: {
      sector: {
        area: {
          cragId: crag.id,
        },
      },
    },
  })
  console.log(`  - Routes deleted: ${routesDeleted.count}`)

  // 2. Delete topo positions (RouteTopoPosition)
  const topoPositionsDeleted = await prisma.routeTopoPosition.deleteMany({
    where: {
      topoImage: {
        sector: {
          area: {
            cragId: crag.id,
          },
        },
      },
    },
  })
  console.log(`  - Topo positions deleted: ${topoPositionsDeleted.count}`)

  // 3. Delete topos (TopoImage)
  const toposDeleted = await prisma.topoImage.deleteMany({
    where: {
      sector: {
        area: {
          cragId: crag.id,
        },
      },
    },
  })
  console.log(`  - Topos deleted: ${toposDeleted.count}`)

  // 4. Delete crag topo positions (CragTopoSectorPosition)
  const cragTopoPositionsDeleted = await prisma.cragTopoSectorPosition.deleteMany({
    where: {
      cragTopo: {
        cragId: crag.id,
      },
    },
  })
  console.log(`  - Crag topo positions deleted: ${cragTopoPositionsDeleted.count}`)

  // 5. Delete crag topos (CragTopoImage)
  const cragToposDeleted = await prisma.cragTopoImage.deleteMany({
    where: {
      cragId: crag.id,
    },
  })
  console.log(`  - Crag topos deleted: ${cragToposDeleted.count}`)

  // 6. Delete sectors
  const sectorsDeleted = await prisma.sector.deleteMany({
    where: {
      area: {
        cragId: crag.id,
      },
    },
  })
  console.log(`  - Sectors deleted: ${sectorsDeleted.count}`)

  // 7. Delete areas
  const areasDeleted = await prisma.area.deleteMany({
    where: {
      cragId: crag.id,
    },
  })
  console.log(`  - Areas deleted: ${areasDeleted.count}`)

  // 8. Delete crag
  await prisma.crag.delete({
    where: { id: crag.id },
  })
  console.log(`  - Crag deleted`)

  console.log('\n✅ Done')

  await prisma.$disconnect()
}

main()
