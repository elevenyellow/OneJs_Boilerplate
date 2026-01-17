import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const total = await prisma.crag.count();
  const withCoords = await prisma.crag.count({
    where: {
      latitude: { not: null },
      longitude: { not: null }
    }
  });
  const sample = await prisma.crag.findFirst({
    where: {
      latitude: { not: null },
      longitude: { not: null }
    },
    select: { id: true, name: true, latitude: true, longitude: true }
  });
  console.log('Total crags:', total);
  console.log('With coordinates:', withCoords);
  console.log('Sample:', sample);
  await prisma.$disconnect();
}

check().catch(console.error);
